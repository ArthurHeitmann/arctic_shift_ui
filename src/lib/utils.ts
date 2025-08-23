
export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function roundTo(num: number, precision: number): number {
	const factor = Math.pow(10, precision);
	return Math.round(num * factor) / factor;
}

export function formatDurationHHMMSS(ms: number, showMs = false): string {
	// HH:MM:SS
	let s = Math.floor(ms / 1000);
	const msPart = showMs ? `,${ms % 1000}` : "";
	const secPart = s % 60;
	s = Math.floor(s / 60);
	const minPart = s % 60;
	const hourPart = Math.floor(s / 60);
	return `${hourPart}:${minPart.toString().padStart(2, "0")}:${secPart.toString().padStart(2, "0")}${msPart}`;
}

function _durationToParts(duration: number, dense = false): { n: number, s: string } {
	const s = Math.round(duration);
	if (s < 60)
		return { n: s, s: dense ? "s" : "seconds" };
	else if (s < 3600)
		return { n: Math.floor(s / 60), s: dense ? "m" : "minutes" };
	else if (s < 86400)
		return { n: Math.floor(s / 3600), s: dense ? "h" : "hours" };
	else if (s < 2592000)
		return { n: Math.floor(s / 86400), s: dense ? "d" : "days" };
	else if (s < 31557600)
		return { n: Math.floor(s / 2592000), s: dense ? "mo" : "months" };
	else
		return { n: Math.floor(s / 31557600), s: dense ? "y" : "years" };
}

/**
 * @param duration in seconds
 */
export function formatDuration(duration: number, dense = false): string {
	const { n, s } = _durationToParts(duration, dense);
	return (
		n.toString() +
		(dense ? "" : " ") +
		(n !== 1 || dense ? s : s.replace(/s$/, "")		// 1 seconds --> 1 second
	));
}

/**
 * 	1 - 59		 	 1s
 *	60 - 3599	 	 1 - 59m
 *	3600 - 86399	 1 - 23h
 *	86400 - 2591999	 1 - 29d
 *	2592000-31557599 1 - 12mo
 *	1 - ..y
 * @param time in seconds
 */
 export function timePassedSince(time: number, includeAdverb = true, adverb = "ago", absAdverb = "at"): string {
	const timeStr = formatDuration(Date.now() / 1000 - time);
	return includeAdverb ? `${timeStr} ${adverb}` : timeStr;
}

function _numberToShort(num: number): { n: number, s?: string } {
	switch (Math.abs(num).toString().length) {
		case 0:
		case 1:
		case 2:
		case 3:
			return { n: num };
		case 4:
			return { n: floorTo(num / 1000, 2), s: "k"};
		case 5:
		case 6:
			return { n: floorTo(num / 1000, 0), s: "k"};
		case 7:
			return { n: floorTo(num / 1000000, 2), s: "m"};
		case 8:
		case 9:
			return { n: floorTo(num / 1000000, 0), s: "m"};
		case 10:
			return { n: floorTo(num / 1000000000, 2), s: "b"};
		case 11:
		case 12:
			return { n: floorTo(num / 1000000000, 0), s: "b"};
		case 13:
			return { n: floorTo(num / 1000000000000, 2), s: "t"};
		case 14:
		case 15:
			return { n: floorTo(num / 1000000000000, 0), s: "t"};
		default:
			return { n: 0, s: " - ∞" }
	}
}

/** convert long numbers like 11,234 to 11k */
export function numberToShort(num: number): string {
	return Object.values(_numberToShort(num)).join("");
}

const byteUnits = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
export function formatBytes(bytes: number, decimals = 1): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + byteUnits[i];
}

export function floorTo(number: number, precision: number): number {
	return Math.floor(number * Math.pow(10, precision)) / Math.pow(10, precision);
}

/**
 * Returns a function, that, when invoked, will only be triggered at most once
 * during a given window of time. Normally, the throttled function will run
 * as much as it can, without ever going more than once per `wait` duration;
 * but if you'd like to disable the execution on the leading edge, pass
 * `{leading: false}`. To disable execution on the trailing edge, ditto.
 * from https://stackoverflow.com/questions/27078285/simple-throttle-in-js
 */
export function throttle(func: any, wait: number, options: { leading?: boolean, trailing?: boolean } = { leading: true, trailing: true}) {
	let context: any, args: any, result: any;
	let timeout: number|null = null;
	let previous = 0;
	if (!options) options = {};
	const later = function() {
		previous = options.leading === false ? 0 : Date.now();
		timeout = null;
		result = func.apply(context, args);
		if (!timeout) {
			context = args = null;
		}
	};
	return function(this: any, ..._: any) {
		const now = Date.now();
		if (!previous && options.leading === false) previous = now;
		const remaining = wait - (now - previous);
		context = this;
		args = arguments;
		if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		} else if (!timeout && options.trailing !== false) {
			timeout = setTimeout(later, remaining);
		}
		return result;
	};
}

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * From: https://gist.github.com/nmsdvid/8807205
 */
export function debounce<T>(this: T, func: any, wait: number, immediate = false) {
	let timeout: number|null;
	return function(this: T) {
		const context = this;
		const args = arguments;
		clearTimeout(timeout!);
		timeout = setTimeout(function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		}, wait);
		if (immediate && !timeout) func.apply(context, args);
	};
}

export function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface EditableTimeStrPartDefinition {
	shortStr: string,
	fullStr: string
	ms: number,
	isPreferred: boolean
}

const editableTimeStrParts: EditableTimeStrPartDefinition[] = [
	{
		shortStr: "y",
		fullStr: "year",
		ms: 1000 * 60 * 60 * 24 * 365,
		isPreferred: true
	},
	{
		shortStr: "mo",
		fullStr: "month",
		ms: 1000 * 60 * 60 * 24 * 30,
		isPreferred: true
	},
	{
		shortStr: "w",
		fullStr: "week",
		ms: 1000 * 60 * 60 * 24 * 7,
		isPreferred: false
	},
	{
		shortStr: "d",
		fullStr: "day",
		ms: 1000 * 60 * 60 * 24,
		isPreferred: true
	},
	{
		shortStr: "h",
		fullStr: "hour",
		ms: 1000 * 60 * 60,
		isPreferred: true
	},
	{
		shortStr: "m",
		fullStr: "minute",
		ms: 1000 * 60,
		isPreferred: true
	},
	{
		shortStr: "s",
		fullStr: "second",
		ms: 1000,
		isPreferred: true
	},
	{
		shortStr: "ms",
		fullStr: "millisecond",
		ms: 1,
		isPreferred: true
	},
];

export function timeMsToEditableTimeStr(timeMs: number, maxParts: number|null = null, includeMs = false): string {
	if (timeMs === 0)
		return "0";

	let out = "";
	let partsUsed = 0;
	let remainingTimeMs = timeMs;
	for (const part of editableTimeStrParts) {
		if (remainingTimeMs <= 0 || (maxParts !== null && partsUsed >= maxParts))
			break;
		if (!part.isPreferred)
			continue;
		const partValue = Math.floor(remainingTimeMs / part.ms);
		if (partValue < 1)
			continue;
		remainingTimeMs -= partValue * part.ms;
		if (!includeMs && part.shortStr === "ms")
			continue;
		out += `${partValue}${part.shortStr}`;
		if (remainingTimeMs <= 0)
			break;
		out += " ";
		partsUsed++;
	}
	return out;
}

export function editableTimeStrToMs(editableStr: string): number | string {
	try {
		if (editableStr === "0")
			return 0;

		if (!/^\s*(\d+\s*[a-zA-Z]+\s*)+$/.test(editableStr)) {
			throw new Error("Invalid time format (example: 1y 7 months 1day 30s");
		}

		let timeMs = 0;

		const pairs = editableStr.match(/\d+\s*[a-zA-Z]+/g)!;
		for (const pair of pairs) {
			const matches = pair.match(/(\d+)\s*([a-zA-Z]+)/)!;
			const number = parseInt(matches[1]);
			if (!number && number !== 0) {
				throw new Error(`Invalid number ${number}`);
			}
			const timeFrame = matches[2]?.toLowerCase();
			const timeStrPart = editableTimeStrParts.find(value => {
				return timeFrame === value.shortStr || timeFrame.replace(/s?$/, "") === value.fullStr;
			});
			if (!timeStrPart) {
				throw new Error(`Invalid timeframe ${timeFrame}`);
			}

			timeMs += number * timeStrPart.ms;
		}

		return timeMs;
	} catch (e) {
		return "Invalid time format (example: 1y 7 months 1day 30s";
	}
}

export function deepCopy<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

export function isJsonEqual(a: any, b: any): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export function lerp(start: number, end: number, fraction: number): number {
	return start + (end - start) * fraction;
}

export function isOnScreen(element: Element): boolean {
	const rect = element.getBoundingClientRect();
	return (
		rect.width > 0 &&
		rect.height > 0 &&
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}

export function copyToClipboard(text: string): Promise<void> {
	if (navigator.clipboard) {
		return navigator.clipboard.writeText(text);
	} else {
		return new Promise((resolve, reject) => {
			const textArea = document.createElement("textarea");
			textArea.value = text;
			textArea.style.position = "fixed";  // avoid scrolling to bottom
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			try {
				const successful = document.execCommand('copy');
				if (successful) {
					resolve();
				} else {
					reject(new Error("Copy command was unsuccessful"));
				}
			} catch (err) {
				reject(err);
			} finally {
				document.body.removeChild(textArea);
			}
		});
	}
}
