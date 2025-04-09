<script lang="ts">
	import "$lib/default.scss";
	import { numberToShort, formatDuration, formatBytes, randomInt } from "$lib/utils";
	import homeSvg from "$lib/images/home.svg";
	import "./style.scss";
	import TimeSeriesChart from "./TimeSeriesChart.svelte";
	import { TimeSeriesDataFetcher } from "./TimeSeriesDataFetcher";
	import SubredditChartPicker from "./SubredditChartPicker.svelte";
	import OptionSelector from "$lib/components/OptionSelector.svelte";

	const dataFetcher = new TimeSeriesDataFetcher();

	enum SubPage {
		global, subreddits
	}
	let currentSubPage: SubPage = SubPage.global;
	let alreadyViewedPages: SubPage[] = [currentSubPage];

	let subredditSelectorIds: number[] = [0];
	let nextSubredditSelectorId = 1;
</script>

<svelte:head>
	<title>Live Reddit Stats</title>
	<meta name="description" content="Monitor Reddit stats in real-time, such as posts and comments per minute, average scores, and more. Look for trends or detect outages." />
</svelte:head>

<div class="charts pane">
	<div class="row title-row">
		<h1>Live Charts</h1>
		<a href="/" class="home-button">
			<img src={homeSvg} alt="home" />
		</a>
	</div>
	<p>
		Monitor Reddit stats in real-time. Look for trends or detect outages. In some cases, it might take a few hours for the data to fully update.
	</p>

	<OptionSelector
		options={[
			{ value: SubPage.global, label: "All of Reddit" },
			{ value: SubPage.subreddits, label: "Subreddits" },
		]}
		selected={currentSubPage}
		onChange={value => {
			currentSubPage = value;
			if (!alreadyViewedPages.includes(value))
				alreadyViewedPages = [...alreadyViewedPages, value];
		}}
		expand={true}
	/>

	<div class="charts-wrapper" class:hidden={currentSubPage !== SubPage.global}>
		{#if alreadyViewedPages.includes(SubPage.global)}
			<TimeSeriesChart
				dataFetcher={dataFetcher}
				title="Total posts and comments"
				apiPathKeys={[
					["global/posts/count"], 
					["global/comments/count"],
				]}
				axisLabels={[
					"Posts per $$",
					"Comments per $$",
				]}
				seriesLabels={["Posts", "Comments"]}
				range={1000 * 60 * 60 * 24}
				updateInterval={1000 * 7}
				numberFormatter={numberToShort}
			/>
			<TimeSeriesChart
				dataFetcher={dataFetcher}
				title="Average archiver retrieval delay"
				apiPathKeys={[
					["global/posts/sum_retrieved_after_seconds", "global/posts/count"],
					["global/comments/sum_retrieved_after_seconds", "global/comments/count"],
				]}
				axisLabels={[
					"Average post retrieval delay",
					"Average comment retrieval delay",
				]}
				seriesLabels={["Posts", "Comments"]}
				range={1000 * 60 * 60 * 24}
				updateInterval={1000 * 45}
				numberFormatter={n => formatDuration(n, true)}
			/>
			<TimeSeriesChart
				dataFetcher={dataFetcher}
				title="Average upvotes"
				apiPathKeys={[
					["global/posts/sum_score", "global/posts/count"],
					["global/comments/sum_score", "global/comments/count"],
				]}
				axisLabels={[
					"Average post upvotes",
					"Average comment upvotes",
				]}
				seriesLabels={["Posts", "Comments"]}
				range={1000 * 60 * 60 * 24}
				updateInterval={1000 * 45}
				numberFormatter={numberToShort}
			/>
		{/if}
	</div>

	<div class="charts-wrapper" class:hidden={currentSubPage !== SubPage.subreddits}>
		{#if alreadyViewedPages.includes(SubPage.subreddits)}
			{#each subredditSelectorIds as id (id)}
				<SubredditChartPicker
					dataFetcher={dataFetcher}
				/>
			{/each}
			<button
				class="add-subreddit-button"
				on:click={() => {
					subredditSelectorIds = [...subredditSelectorIds, nextSubredditSelectorId];
					nextSubredditSelectorId++;
				}}
			>
				+ Add subreddit
			</button>
		{/if}
	</div>
</div>
