<script lang="ts">
    import type { ArchiveStream } from "$lib/archiveStream";
	import "$lib/default.scss";
    import type { RedditCommentData, RedditPostData } from "$lib/redditTypes";
    import { formatDuration, roundTo } from "$lib/utils";
    import { onDestroy, onMount } from "svelte";

	export let name: string;
	export let archiveStream: ArchiveStream<any>;
	export let endDate: Date|null;

	let downloadedThings = 0;
	let currentDate = archiveStream.currentDate;
	let isRunning = archiveStream.isRunning;
	let isDone = archiveStream.isDone;
	let hasError = archiveStream.hasError;
	let runTime = 0;
	let updateInterval: number|null = null;

	onMount(() => {
		archiveStream.onStateChange.addListener(onStateChange);
		archiveStream.onNewData.addListener(onNewData);
		setInterval(onTick, 1000);
	});

	onDestroy(() => {
		archiveStream.onStateChange.removeListener(onStateChange);
		archiveStream.onNewData.removeListener(onNewData);
		if (updateInterval !== null)
			clearInterval(updateInterval);
	});

	function onStateChange() {
		isRunning = archiveStream.isRunning;
		isDone = archiveStream.isDone;
		hasError = archiveStream.hasError;
	}

	function onNewData(data: any[]) {
		currentDate = archiveStream.currentDate;
		downloadedThings += data.length;
	}

	function onTick() {
		runTime = archiveStream.runningSw.elapsed;
	}

	function progressPercent(date: number, isDone: boolean): number {
		if (isDone && !hasError)
			return 100;
		const totalDuration = (endDate?.getDate() ?? Date.now()) - archiveStream.startDate;
		const processedDuration = date - archiveStream.startDate;
		return roundTo(processedDuration / totalDuration * 100, 2);
	}

	function formatIsoDate(date: Date) {
		return date.toISOString()
			.replace("T", " ")
			.split(".")[0];
	}
</script>

<div class="archive-stream-feedback">
	<div class="row">
		<div>
			Downloaded {downloadedThings} {name}s in {formatDuration(runTime)}
		</div>
		<div>
		{#if isDone}
			{#if hasError}
				Failed :(
			{:else}
				Download complete 🎉
			{/if}
		{:else if isRunning}
			{#if hasError}
				Error :(
			{:else}
				Downloading...
			{/if}
		{/if}
		</div>
	</div>
	<div
		class="row progress"
		style={`--percent: ${progressPercent(currentDate, isDone)}%;`}
	>
		<div class="date">
			{formatIsoDate(new Date(currentDate))}
		</div>
		<div class="date">
			{formatIsoDate(endDate ?? new Date()).split(" ")[0]}
		</div>
	</div>
</div>

<style lang="scss">
	.archive-stream-feedback {
		width: 100%;
	}

	.row {
		align-items: center;
		justify-content: space-between;

		&:not(.progress) {
			padding: 0 1rem;
		}
	}

	.progress {
		--percent: 0%;
		width: 100%;
		height: 2.5rem;
		margin: 0.5rem 0;
		border-radius: 2rem;
		border: 1px solid var(--primary);
		padding: 0 .75rem;
		display: flex;
		position: relative;

		&::before {
			content: "";
			position: absolute;
			top: -1px;
			left: -2px;
			display: block;
			min-width: 2rem;
			width: calc(var(--percent) + 2px);
			height: calc(100% + 2px);
			background-color: var(--primary);
			border-radius: 2rem;
			transition: width 0.75s ease;
		}

		.date {
			color: var(--text-color);
			position: relative;
		}
	}
</style>
