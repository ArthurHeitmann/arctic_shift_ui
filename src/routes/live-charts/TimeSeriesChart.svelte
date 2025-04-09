<script lang="ts">
	import "$lib/default.scss";
	import { onDestroy, onMount } from "svelte";
	import "./style.scss";
	import * as d3 from "d3";
	import { deepCopy, editableTimeStrToMs, isJsonEqual, isOnScreen, lerp, numberToShort, throttle, timeMsToEditableTimeStr } from "$lib/utils";
	import { type Precision, type TimeSeriesData, TimeSeriesDataFetcher } from "./TimeSeriesDataFetcher";
	import TextField from "$lib/components/TextField.svelte";

	export let title: string = "";
	export let apiPathKeys: ([string]|[string, string])[];
	export let axisLabels: string[] = [];
	export let seriesLabels: string[] = [];
	export let colors: string[] = apiPathKeys.map((_, i) => d3.schemeCategory10[i]);
	export let range = 1000 * 60 * 60 * 24 * 0.5;
	export let minPrecision: Precision = "minute";
	export let updateInterval = 0;
	export let dataFetcher: TimeSeriesDataFetcher;
	export let numberFormatter: (n: number) => string = (n) => n.toString();
	
	let lastApiPathKeys: ([string]|[string, string])[] = deepCopy(apiPathKeys);
	let updateIntervalId: number = 0;
	let lastUpdateAt: number = 0;
	
	let data: TimeSeriesData[] = [];
	let rangeEnd: Date|null = null;
	
	let isDragging = false;
	let lastClientX = 0;
	let lastWidth = 0;
	let hasPendingWidthUpdate = false;
	
	let chartContainer: SVGSVGElement;
	const height = 300;
	const padding = {top: 15, right: 47, bottom: 20, left: 49};
	const hasRightAxis = apiPathKeys.length > 1;
	let hasInitialized = false;
	let xAxisScale: d3.ScaleTime<number, number>;
	let xAxis: d3.Axis<Date | d3.NumberValue>;
	let xAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	let yAxisLeftScale: d3.ScaleLinear<number, number>;
	let yAxisLeft: d3.Axis<number | d3.NumberValue>;
	let leftAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	let yAxisRightScale: d3.ScaleLinear<number, number>|null = null;
	let yAxisRight: d3.Axis<number | d3.NumberValue>|null = null;
	let axisRightGroup: d3.Selection<SVGGElement, unknown, null, undefined>|null = null;
	let linesGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	
	let [dataFetcherGroupId, dataStream] = dataFetcher.newGroup(apiPathKeys);

	$: {
		if (!isJsonEqual(apiPathKeys, lastApiPathKeys)) {
			lastApiPathKeys = deepCopy(apiPathKeys);
			disposeDataStream();
			[dataFetcherGroupId, dataStream] = dataFetcher.newGroup(apiPathKeys);
			initializeDataStream();
		}
	}

	function initializeChart() {
		if (hasInitialized)
			return;
		if (!chartContainer?.parentElement)
			return;
		
		const width = chartContainer.parentElement!.clientWidth;
		if (width === 0)
			return;

		const svg = d3.select(chartContainer)
			.attr("width", width)
			.attr("height", height);

		const rangeEndTs = new Date();
		const rangeStartTs = new Date(rangeEndTs.getTime() - range);

		// X axis
		xAxisScale = d3.scaleTime()
			// @ts-ignore
			.domain([rangeStartTs, rangeEndTs])
			.range([padding.left, width - padding.right]);
		xAxis = d3.axisBottom(xAxisScale);

		// Y axis left
		yAxisLeftScale = d3.scaleLinear()
			.range([height - padding.bottom, padding.top]);
		yAxisLeft = d3.axisLeft(yAxisLeftScale)
			 // @ts-ignore
			.tickFormat(numberFormatter);

		// Y axis right
		yAxisRightScale = hasRightAxis ?
			d3.scaleLinear()
				.range([height - padding.bottom, padding.top])
			: null;
		yAxisRight = hasRightAxis ?
			d3.axisRight(yAxisRightScale!)
				 // @ts-ignore
				.tickFormat(numberFormatter)
			: null;

		xAxisGroup = svg.append("g")
			.classed("x-axis", true)
			.attr("transform", `translate(0, ${height - padding.bottom})`)
			.call(xAxis);
		leftAxisGroup = svg.append("g")
			.classed("y-axis", true)
			.attr("transform", `translate(${padding.left}, 0)`);
		if (axisLabels.length >= 1) {
			leftAxisGroup.append("text")
				.attr("text-anchor", "middle")
				.attr("transform", "rotate(-90)")
				.attr("dy", "1em")
				.attr("x", -height / 2)
				.attr("y", -padding.left)
				.attr("fill", "currentColor")
				.text((axisLabels[0] ?? "").replace("$$", data[0]?.precision ?? ""));
		}
		// @ts-ignore
		leftAxisGroup.call(yAxisLeft);
		if (hasRightAxis) {
			axisRightGroup = svg.append("g")
				.classed("y-axis", true)
				.attr("transform", `translate(${width - padding.right}, 0)`);
			if (axisLabels.length >= 2) {
				axisRightGroup.append("text")
					.attr("text-anchor", "middle")
					.attr("transform", "rotate(-90)")
					.attr("dy", "-0.5em")
					.attr("x", -height / 2)
					.attr("y", padding.right)
					.attr("fill", "currentColor")
					.text((axisLabels[1] ?? "").replace("$$", data[1]?.precision ?? ""));
			}
			// @ts-ignore
			axisRightGroup.call(yAxisRight!);
		}

		// draw lines
		linesGroup = svg.append("g")
			.classed("lines", true);
		linesGroup.selectAll(".line")
			.data(data.map((d, i) => ({
				points: d,
				axisScale: i % 2 === 0 ? yAxisLeftScale : yAxisRightScale!,
				color: colors[i] ?? d3.schemeCategory10[i],
			})))
			.enter()
			.append("path")
			.classed("line", true)
			.attr("fill", "none")
			.attr("stroke", d => d.color)
			.attr("stroke-width", 3)
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			;

		hasInitialized = true;
	}
	
	function destroyChart() {
		if (!chartContainer)
			return;
		d3.select(chartContainer).selectAll("*").remove();
		hasInitialized = false;
	}

	function updateChart() {
		if (!chartContainer?.parentElement)
			return;
		if (!hasInitialized)
			initializeChart();

		const width = chartContainer.parentElement.clientWidth;
		if (width === 0)
			return;
		hasPendingWidthUpdate = false;
		
		d3.select(chartContainer)
			.attr("width", width);
		
		const rangeEndTs = rangeEnd ?? new Date();
		const rangeStartTs = new Date(rangeEndTs.getTime() - range);
		const filteredData = data
			.map(d => {
				const startI = d.points.findIndex(([date]) => date >= rangeStartTs);
				let endI = d.points.findIndex(([date]) => date > rangeEndTs);
				if (startI === -1 || endI === 0)
					return [];
				if (endI === -1)
					endI = d.points.length;
				const data = d.points.slice(startI, endI);
				if (startI > 0) {
					const start = d.points[startI];
					const prev = d.points[startI - 1];
					const frac = (rangeStartTs.getTime() - prev[0].getTime()) / (start[0].getTime() - prev[0].getTime());
					if (frac > 0 && frac < 1) {
						data.unshift([
							new Date(lerp(prev[0].getTime(), start[0].getTime(), frac)),
							lerp(prev[1], start[1], frac),
						]);
					}
				}
				if (endI < d.points.length) {
					const start = d.points[endI - 1];
					const next = d.points[endI];
					const frac = (rangeEndTs.getTime() - start[0].getTime()) / (next[0].getTime() - start[0].getTime());
					if (frac > 0 && frac < 1) {
						data.push([
							new Date(lerp(start[0].getTime(), next[0].getTime(), frac)),
							lerp(start[1], next[1], frac),
						]);
					}
				}
				return data;
			});
		let maxYLeft = d3.max(
			filteredData.filter((_, i) => i % 2 === 0).flat(),
			d => d[1]
		)!;
		let maxYRight = hasRightAxis ?
			d3.max(
				filteredData.filter((_, i) => i % 2 === 1).flat(),
				d => d[1]
			)!
			: null;
		if (maxYLeft && maxYRight && Math.abs(maxYLeft - maxYRight) / maxYLeft < 0.3) {
			maxYLeft = Math.max(maxYLeft, maxYRight);
			maxYRight = maxYLeft;
		}

		// X axis
		xAxisScale
			// @ts-ignore
			.domain([rangeStartTs, rangeEndTs])
			.range([padding.left, width - padding.right]);

		// Y axis left
		yAxisLeftScale
			.domain([0, maxYLeft])
			.range([height - padding.bottom, padding.top]);
		yAxisLeft
			.ticks(6)
			 // @ts-ignore
			.tickFormat(numberFormatter);

		// Y axis right
		yAxisRightScale
			?.domain([0, maxYRight!])
			.range([height - padding.bottom, padding.top])
			;
		yAxisRight
			?.ticks(6)
				// @ts-ignore
			.tickFormat(numberFormatter);

		xAxisGroup
			.attr("transform", `translate(0, ${height - padding.bottom})`)
			.call(xAxis);
		leftAxisGroup
			.attr("transform", `translate(${padding.left}, 0)`);
		if (axisLabels.length >= 1) {
			leftAxisGroup
				.select("text")
				.attr("x", -height / 2)
				.text((axisLabels[0] ?? "").replace("$$", data[0]?.precision ?? ""));
		}
		// @ts-ignore
		leftAxisGroup.call(yAxisLeft);
		if (hasRightAxis) {
			axisRightGroup
				?.attr("transform", `translate(${width - padding.right}, 0)`)
				;
			if (axisLabels.length >= 2) {
				axisRightGroup
					?.select("text")
					.attr("x", -height / 2)
					.text((axisLabels[1] ?? "").replace("$$", data[1]?.precision ?? ""));
			}
			// @ts-ignore
			axisRightGroup.call(yAxisRight!);
		}

		// draw lines
		linesGroup.selectAll(".line")
			.data(filteredData.map((d, i) => ({
				points: d,
				axisScale: i % 2 === 0 ? yAxisLeftScale : yAxisRightScale!,
				color: colors[i] ?? d3.schemeCategory10[i],
			})))
			.attr("d", line => d3.line()
				.x((d) => xAxisScale(d[0]))
				.y((d) => line.axisScale(Math.abs(d[1])))
				// @ts-ignore
				(line.points)
			);
	}

	async function fetchData() {
		dataFetcher.onParamsChanged(dataFetcherGroupId, apiPathKeys, rangeEnd, range, minPrecision);
	}
	const fetchDataSlow = throttle(fetchData, 200);

	function fetchAndDraw() {
		updateChart();
		fetchDataSlow();
	}

	function isEventOutsideChart(e: any): boolean {
		const absX = e.clientX || e.touches[0].clientX;
		const absY = e.clientY || e.touches[0].clientY;
		const rect = chartContainer.getBoundingClientRect();
		const localX = absX - rect.left;
		const localY = absY - rect.top;
		return (
			localX < padding.left ||
			localX > rect.width - padding.right ||
			localY < padding.top ||
			localY > rect.height - padding.bottom
		);
	}

	function onDragStart(e: any) {
		if (isEventOutsideChart(e))
			return;
		if (e.touches && e.touches.length > 1)
			return;
		if (!e.touches && e.button !== 0)
			return;
		isDragging = true;
		lastClientX = e.clientX || e.touches[0].clientX;
		e.preventDefault();
	}

	function onDragEnd() {
		isDragging = false;
	}

	function getMinDate(): number {
		let minDate = Math.min(...data.map(d => d.points[0][0].getTime()));
		if (minDate === Infinity)
			minDate = new Date(2000, 0, 1).getTime();
		return minDate;
	}

	function onDrag(e: any) {
		if (!isDragging)
			return;
		const clientX = e.clientX || e.touches[0].clientX;
		const deltaX = clientX - lastClientX;
		if (deltaX === 0)
			return;
		lastClientX = clientX;
		const width = chartContainer.clientWidth - padding.left - padding.right;
		const movedBy = deltaX/width * range;
		rangeEnd = new Date((rangeEnd ?? new Date()).getTime() - movedBy);
		if (rangeEnd.getTime() > Date.now())
			rangeEnd = null;
		else if (rangeEnd.getTime() - range < getMinDate())
			rangeEnd = new Date(getMinDate() + range);
		e.preventDefault();
		fetchAndDraw();
	}

	function onScroll(e: WheelEvent) {
		if (isEventOutsideChart(e))
			return;
		const delta = e.deltaY;
		const scaledBy =  1 - Math.min(0.5, Math.max(-0.5, -delta / 1000));
		if (scaledBy === 1)
			return;
		const movedBy = (1 - scaledBy) * range / 2;
		range *= scaledBy;
		const timeSinceStart = Date.now() - getMinDate();
		range = Math.min(range, timeSinceStart);
		rangeEnd = new Date((rangeEnd ?? new Date()).getTime() - movedBy);
		if (rangeEnd.getTime() > Date.now())
			rangeEnd = null;
		e.preventDefault();
		fetchAndDraw();
	}

	function onWindowResize() {
		const newWidth = chartContainer.parentElement!.clientWidth;
		if (newWidth === lastWidth)
			return;
		if (newWidth === 0) {
			hasPendingWidthUpdate = true;
			return;
		}
		lastWidth = newWidth;
		updateChart();
	}

	function onWindowFocus() {
		if (!chartContainer || !isOnScreen(chartContainer))
			return;
		if (updateInterval === 0 || Date.now() - lastUpdateAt <= updateInterval)
			return;
		fetchData();
	}

	function formatDate(date: Date|null) {
		if (!date)
			return "now";
		return date.getFullYear().toString().padStart(2, "0") +
			"-" + (date.getMonth() + 1).toString().padStart(2, "0") +
			"-" + date.getDate().toString().padStart(2, "0") +
			" " + date.getHours().toString().padStart(2, "0") +
			":" + date.getMinutes().toString().padStart(2, "0") +
			":" + date.getSeconds().toString().padStart(2, "0");
	}

	function validateDate(dateStr: string, allowNow = false): string|null {
		if (allowNow && dateStr === "now")
			return null;
		if (!/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?$/.test(dateStr))
			return "Invalid date";
		return null;
	}

	function parseDate(dateStr: string): Date|null {
		if (dateStr === "now")
			return null;
		const parts = dateStr.split(/[- T:]/).map(Number);
		return new Date(parts[0], parts[1] - 1, parts[2], parts[3] ?? 0, parts[4] ?? 0, parts[5] ?? 0);
	}

	function initializeDataStream() {
		const currentId = dataFetcherGroupId;
		data = apiPathKeys.map((keys) => ({
			key: keys,
			precision: "minute",
			points: [],
		}));
		dataStream.addListener(series => {
			if (currentId !== dataFetcherGroupId)
				return;
			lastUpdateAt = Date.now();
			data = series;
			updateChart();
		});
		destroyChart();
		initializeChart();
		fetchData();
	}
	
	function disposeDataStream() {
		dataFetcher.disposeGroup(dataFetcherGroupId);
	}

	onMount(() => {
		initializeDataStream();
		if (updateInterval > 0) {
			updateIntervalId = setInterval(() => {
				if (document.hidden)
					return;
				if (rangeEnd !== null || range > 1000 * 60 * 60 * 24 * 3)
					return;
				if (!chartContainer || !isOnScreen(chartContainer))
					return;
				fetchData();
			}, updateInterval);
		}
	});

	onDestroy(() => {
		disposeDataStream();
		clearInterval(updateIntervalId);
	});
</script>

<svelte:window
	on:resize={onWindowResize}
	on:focus={onWindowFocus}
/>

<div class="chart">
	{#if title}
		<div class="chart-title">
			{title}
		</div>
	{/if}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<svg
		bind:this={chartContainer}
		on:mousemove={onDrag}
		on:mousedown={onDragStart}
		on:mouseup={onDragEnd}
		on:mouseleave={onDragEnd}
		on:touchstart={onDragStart}
		on:touchend={onDragEnd}
		on:touchmove={onDrag}
		on:wheel={onScroll}
	/>
	<div class="chart-below">
		<div class="date-range">
			<span>Until:</span>
			<TextField
				text={formatDate(rangeEnd)}
				getError={t => validateDate(t, true)}
				onChange={v => {
					rangeEnd = parseDate(v);
					fetchAndDraw();
				}}
				width="12rem"
				simpleDesign={true}
			/>
			<span> for:</span>
			<TextField
				text={timeMsToEditableTimeStr(range, 2, false)}
				getError={t => {
					const ms = editableTimeStrToMs(t);
					if (typeof ms === "string")
						return ms;
					return null;
				}}
				onChange={v => {
					const ms = editableTimeStrToMs(v)
					if (typeof ms === "number") {
						range = ms;
						fetchAndDraw();
					}
				}}
				width="6rem"
				simpleDesign={true}
			/>
		</div>
		<div class="legend">
			{#each apiPathKeys as _, i}
				{#if i < seriesLabels.length}
					<div class="legend-item">
						<div class="legend-color" style="background-color: {colors[i]}"></div>
						<div class="legend-label">{seriesLabels[i]}</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>
