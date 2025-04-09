<script lang="ts">
	import { numberToShort, formatDuration, formatBytes } from "$lib/utils";
	import OptionSelector from "$lib/components/OptionSelector.svelte";
	import TextField from "$lib/components/TextField.svelte";
	import "$lib/default.scss";
	import "./style.scss";
	import TimeSeriesChart from "./TimeSeriesChart.svelte";
	import { TimeSeriesDataFetcher } from "./TimeSeriesDataFetcher";

	export let dataFetcher: TimeSeriesDataFetcher;

	enum Category {
		total, total_score, avg_score, subscribers
	}
	const categories = [
		{ value: Category.total, label: "Totals" },
		{ value: Category.total_score, label: "Total upvotes" },
		{ value: Category.avg_score, label: "Average upvotes" },
		{ value: Category.subscribers, label: "Subscribers" },
	];
	const categoryToKeys: Record<Category, ([string]|[string, string])[]> = {
		[Category.total]: [["posts/count"], ["comments/count"]],
		[Category.total_score]: [["posts/sum_score"], ["comments/sum_score"]],
		[Category.avg_score]: [["posts/sum_score", "posts/count"], ["comments/sum_score", "comments/count"]],
		[Category.subscribers]: [["subscribers"]],
	}
	const categoryToTitle: Record<Category, string> = {
		[Category.total]: "total posts and comments",
		[Category.total_score]: "total post and comment upvotes",
		[Category.avg_score]: "average upvotes",
		[Category.subscribers]: "subscribers",
	}
	const categoryToAxisLabels: Record<Category, string[]> = {
		[Category.total]: ["Posts per $$", "Comments per $$"],
		[Category.total_score]: ["Posts upvotes per $$", "Comments upvotes per $$"],
		[Category.avg_score]: ["Average post upvotes", "Average comment upvotes"],
		[Category.subscribers]: ["Subscribers"],
	}
	const categoryToSeriesLabels: Record<Category, string[]> = {
		[Category.total]: ["Posts", "Comments"],
		[Category.total_score]: ["Posts", "Comments"],
		[Category.avg_score]: ["Posts", "Comments"],
		[Category.subscribers]: ["Subscribers"],
	}
	const categoryToYearRange: Record<Category, number> = {
		[Category.total]: 10,
		[Category.total_score]: 10,
		[Category.avg_score]: 10,
		[Category.subscribers]: 7,
	}
	const categoryToNumberFormatter: Record<Category, (value: number) => string> = {
		[Category.total]: numberToShort,
		[Category.total_score]: numberToShort,
		[Category.avg_score]: numberToShort,
		[Category.subscribers]: numberToShort,
	}

	let subreddit: string = "AskReddit";
	let category: Category = Category.total;
	$: apiPathKeys = categoryToKeys[category].map(keys => keys.map(key => `r/${subreddit}/${key}`) as ([string]|[string, string]));
	$: title = `r/${subreddit} ${categoryToTitle[category]}`;
	$: axisLabels = categoryToAxisLabels[category];
	$: seriesLabels = categoryToSeriesLabels[category];
	$: range = 1000 * 60 * 60 * 24 * 365 * categoryToYearRange[category];
	$: numberFormatter = categoryToNumberFormatter[category];
</script>

<div>
	<div class="input-row">
		<TextField
			placeholder="Subreddit"
			text={subreddit}
			onChange={sub => subreddit = sub}
			transform={sub => sub.replace(/\/?r\//, "")}
			simpleDesign={true}
		/>
		<OptionSelector
			options={categories}
			selected={category}
			onChange={cat => category = cat}
		/>
	</div>
	<TimeSeriesChart
		dataFetcher={dataFetcher}
		title={title}
		apiPathKeys={apiPathKeys}
		axisLabels={axisLabels}
		seriesLabels={seriesLabels}
		range={range}
		minPrecision="day"
		updateInterval={0}
		numberFormatter={numberFormatter}
	/>
</div>

<style lang="scss">
	.input-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}
</style>
