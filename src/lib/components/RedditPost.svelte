<script lang="ts">
	import "$lib/default.scss";
	import type { RedditPostData } from "$lib/redditTypes";
	import DateDisplay from "./DateDisplay.svelte";
	import RedditImagePreview from "./RedditImagePreview.svelte";

	export let data: RedditPostData;
</script>

<div class="pane">
	<div class="header">
		<a href={`https://reddit.com/r/${data.subreddit}`} target="_blank">r/{data.subreddit} </a>
		<span>by </span>
		<a href={`https://reddit.com/u/${data.author}`} target="_blank">u/{data.author} </a>
		<span><DateDisplay date={new Date(data.created_utc * 1000)} /></span>
		<span> | </span>
		<span>{data.score} 🠉</span>
	</div>
	<div class="title long-text">{data.title}</div>
	{#if data.url && !data.url.endsWith(data.permalink)}
		<div class="url-row">
			<a href={data.url} class="url long-url" target="_blank">{data.url}</a>
			{#if data.preview}
				<RedditImagePreview data={data} />
			{/if}
		</div>
	{/if}
	{#if data.selftext}
		<div class="selftext long-text">
			{@html data.selftext_html}
		</div>
	{/if}
	<div class="reddit-link">
		<span>Source link:&nbsp;</span>
		<a href={`https://reddit.com${data.permalink}`} target="_blank" class="long-url">{`https://reddit.com${data.permalink}`}</a>
	</div>
</div>

<style lang="scss">
	.header {
		a {
			color: var(--primary);
		}
	}

	.title {
		font-size: 1.5rem;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.reddit-link {
		display: flex;
		flex-direction: row;
		margin-top: 0.5rem;

		> * {
			white-space: nowrap;
			font-size: 0.8rem;
		}
	}

	.selftext {
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.url-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;

		.url {
			flex: 1;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.long-url {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
		display: inline-block;
	}

	.long-text {
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>