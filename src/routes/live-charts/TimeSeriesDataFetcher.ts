import { apiUrl } from "$lib/const";
import { Notifier } from "$lib/notifier";
import { randomInt } from "$lib/utils";

export interface TimeSeriesData {
	key: [string]|[string, string];
	precision: Precision;
	points: [Date, number][];
}

export class TimeSeriesDataFetcher {
	private requestGroups: {[groupId: number]: RequestGroup} = {};

	onParamsChanged(groupId: number, keys: ([string]|[string, string])[], before: Date|null, duration: number, minPrecision: Precision) {
		const targetGroup = this.requestGroups[groupId];
		if (!targetGroup)
			throw new Error("Invalid group ID");
		const allKeys = keys.flat();
		for (const key of allKeys) {
			const params: RequestParams = {
				key,
				before,
				duration,
				precision: getPrecisionFor(duration, minPrecision),
			};
			let hasMatchingCache = false;
			for (const group of Object.values(this.requestGroups)) {
				hasMatchingCache = group.cachesHave(params);
				if (!hasMatchingCache)
					continue;
				const series = group.getCacheOf(params);
				if (group !== targetGroup) {
					targetGroup.updateCacheWithSeries(params, series);
				}
				else {
					targetGroup.publishData();
				}
				break;
			}
			if (!hasMatchingCache) {
				targetGroup.onParamsChanged(params);
			}
		};
	}

	newGroup(keys: ([string]|[string, string])[]): [number, Notifier<TimeSeriesData[]>] {
		const id = randomInt(0, 2**31);
		const requestGroup = new RequestGroup(keys);
		this.requestGroups[id] = requestGroup;
		return [id, requestGroup.dataStream];
	}

	disposeGroup(groupId: number) {
		delete this.requestGroups[groupId];
	}
}

export type Precision = "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year";
interface RequestParams {
	key: string;
	before: Date|null;
	duration: number;
	precision: Precision;
}

class RequestGroup {
	private usesCombinedKeys: boolean;
	private caches: RequestCache[] = [];
	private data: (TimeSeriesData|null)[] = [];
	private postProcessedData: TimeSeriesData[] = [];
	readonly dataStream: Notifier<TimeSeriesData[]> = new Notifier();

	constructor(keys: ([string]|[string, string])[]) {
		this.usesCombinedKeys = keys[0].length == 2;
		this.data = keys.flat().map(() => null);
		this.postProcessedData = keys.map(key => ({
			key,
			points: [],
			precision: "minute",
		}));
	}

	async onParamsChanged(params: RequestParams): Promise<void> {
		const cache = this.getOrCreateCache(params);
		cache.onParamsChanged(params);
	}

	updateCacheWithSeries(params: RequestParams, series: Promise<TimeSeriesData>) {
		const cache = this.getOrCreateCache(params);
		cache.updateWithSeries(params, series);
	}

	private getOrCreateCache(params: RequestParams) {
		let cache = this.caches.find(c => c.key === params.key);
		if (cache === undefined) {
			const cacheIndex = this.caches.length;
			cache = new RequestCache(params);
			this.caches.push(cache);
			cache.dataStream.addListener(newData => this.onCacheUpdate(cacheIndex, newData));
		}
		return cache;
	}

	cachesHave(params: RequestParams): boolean {
		return this.caches.some(c => c.isValidFor(params));
	}

	getCacheOf(params: RequestParams): Promise<TimeSeriesData> {
		const cache = this.caches.find(c => c.key == params.key);
		if (cache === undefined)
			throw Error(`Could not find cache of ${JSON.stringify(params)}`);
		return cache.getData();
	}

	dispose() {
		this.dataStream.removeAllListeners();
		for (const cache of this.caches)
			cache.dispose();
	}

	private onCacheUpdate(cacheIndex: number, newData: TimeSeriesData) {
		this.data[cacheIndex] = newData;
		if (this.usesCombinedKeys) {
			for (let i = 0; i < this.postProcessedData.length; i++) {
				const sumSeries = this.data[i * 2];
				const totalsSeries = this.data[i * 2 + 1];
				if (sumSeries === null || totalsSeries === null)
					continue;
				if (sumSeries.precision !== totalsSeries.precision)
					continue;
				const totalsMap = new Map<number, number>();
				for (const [date, total] of totalsSeries.points)
					totalsMap.set(date.getTime(), total);
				const series = this.postProcessedData[i];
				series.precision = sumSeries.precision;
				series.points = [];
				for (const [date, sum] of sumSeries.points) {
					const total = totalsMap.get(date.getTime());
					if (total)
						series.points.push([date, sum / total]);
				}
			}
		}
		else {
			this.postProcessedData[cacheIndex] = newData;
		}
		this.publishData();
	}

	publishData() {
		this.dataStream.notify(this.postProcessedData);
	}
}

const maxCacheTtl = 59 * 1000;
const shortCacheTtl = 3.5 * 1000;
const fetchMargin = 1.0;
const checkMargin = 0.1;
class RequestCache {
	key: string;
	private before: Date|null;
	private duration: number;
	private precision: Precision;
	readonly dataStream: Notifier<TimeSeriesData> = new Notifier();
	private fetchedAt: Date|null = null;
	private isFetching: boolean = false;
	private pendingRequest: Promise<TimeSeriesData>|null = null;
	private pendingFetchParams: RequestParams|null = null;

	constructor(params: RequestParams) {
		this.key = params.key;
		this.before = params.before;
		this.duration = params.duration;
		this.precision = params.precision;
	}

	updateWithSeries(params: RequestParams, series: Promise<TimeSeriesData>) {
		if (this.isFetching)
			return;
		this.setParams(params, false);
		this.pendingRequest = series;
		this.fetchedAt = new Date();
		this.pendingRequest.then(this.onRequestCompleted.bind(this));
		this.pendingRequest.catch(this.onRequestFailed.bind(this));
		this.pendingRequest.finally(this.onRequestDone.bind(this));
	}
	
	onParamsChanged(params: RequestParams) {
		if (this.isFetching) {
			this.pendingFetchParams = params;
			return;
		}
		this.setParams(params, true);
		this.isFetching = true;
		this.pendingRequest = new Promise(async (resolve) => {
			let [start, end] = makeRange(this.before, this.duration, 0);
			start = Math.max(start, new Date(2000, 0, 1).getTime());
			let url = `${apiUrl}/api/time_series?key=${this.key}&precision=${this.precision}&after=${start}&before=${end}`;
			const response = await fetch(url);
			const data = await response.json() as ApiResponseData;
			const points = data.data!.map(p => <[Date, number]>[
				new Date(p.date * 1000),
				p.value,
			]);
			this.fetchedAt = new Date();
			resolve({
				key: [this.key],
				precision: this.precision,
				points,
			});
		});
		this.pendingRequest.then(this.onRequestCompleted.bind(this));
		this.pendingRequest.catch(this.onRequestFailed.bind(this));
		this.pendingRequest.finally(this.onRequestDone.bind(this));
	}

	private async onRequestCompleted(series: TimeSeriesData) {
		this.dataStream.notify(series);
	}

	private async onRequestDone() {
		this.isFetching = false;
		if (this.pendingFetchParams === null)
			return;
		const newParams = this.pendingFetchParams;
		this.pendingFetchParams = null;
		this.onParamsChanged(newParams);
	}

	private async onRequestFailed() {
	}

	setParams(params: RequestParams, applyMargin: boolean) {
		if (params.key !== this.key)
			throw Error(`Params with wrong key passed: ${params.key} !== ${this.key}`)
		this.before = params.before;
		this.duration = params.duration;
		const marginPercent = applyMargin ? fetchMargin : 0;
		const margin = this.duration * marginPercent;
		if (params.before !== null) {
			this.before = new Date(params.before.getTime() + margin);
			this.duration += margin * 2;
		}
		else {
			this.before = null;
			this.duration += margin;
		}
		this.duration = Math.round(this.duration);
		this.precision = params.precision;
	}
	
	isValidFor(params: RequestParams): boolean {
		if (this.key != params.key)
			return false;
		if (this.precision != params.precision)
			return false;
		if (this.dataStream === null && !this.isFetching)
			return false;
		const cacheAge = Date.now() - (this.fetchedAt?.getTime() ?? Date.now());
		if (cacheAge > maxCacheTtl)
			return false;
		if (params.before !== null)
			return this.isWithinRange(params.before, params.duration);
		if (!this.isWithinRange(params.before, params.duration))
			return false;
		if (getPrecisionDuration(this.precision) <= getPrecisionDuration("hour"))
			return cacheAge <= shortCacheTtl;
		return true;
	}

	getData(): Promise<TimeSeriesData> {
		if (this.pendingRequest === null)
			throw Error("RequestCache data has no data");
		return this.pendingRequest;
	}

	isWithinRange(before: Date|null, duration: number): boolean {
		const expectedRange = makeRange(before, duration, checkMargin);
		const currentRange = makeRange(this.before, this.duration, 0);

		return expectedRange[0] >= currentRange[0] && expectedRange[1] <= currentRange[1];
	}

	dispose() {
		this.dataStream.removeAllListeners();
	}
}

const precisionDurations: {[precision in Precision]: number} = {
	"minute": 60 * 1000,
	"hour": 60 * 60 * 1000,
	"day": 24 * 60 * 60 * 1000,
	"week": 7 * 24 * 60 * 60 * 1000,
	"month": 30 * 24 * 60 * 60 * 1000,
	"quarter": 90 * 24 * 60 * 60 * 1000,
	"year": 365 * 24 * 60 * 60 * 1000,
};

function getPrecisionFor(duration: number, minPrecision: Precision): Precision {
	const targetPoints = duration < (2 * 24 * 60 * 60 * 1000) ? 2200 : 1800;
	const startIndex = Object.keys(precisionDurations).indexOf(minPrecision);
	let precisionObj = Object.entries(precisionDurations).find(([precision, precisionDuration], i) => i >= startIndex && duration / precisionDuration < targetPoints);
	if (precisionObj === undefined)
		precisionObj = Object.entries(precisionDurations).find(([precision, precisionDuration]) => precision === "year")!;
	let precision = precisionObj[0] as Precision;
	if (precision === "hour" && duration / precisionObj[1] > 500)
		precision = "day";
	return precision;
}

function getPrecisionDuration(precision: Precision): number {
	const duration = precisionDurations[precision];
	if (duration === undefined)
		throw new Error(`Invalid precision: ${precision}`);
	return duration;
}

function makeRange(before: Date|null, duration: number, marginPercent: number): [number, number] {
	const margin = duration * marginPercent;
	const end = before !== null ? before.getTime() + margin : Date.now();
	const start = end - duration - margin * (before !== null ? 2 : 1);
	return [start, end];
}

interface ApiResponseData {
	data?: {
		date: number,
		value: number,
	}[]
}
