<script lang="ts">
	import "$lib/default.scss";
    import type { RedditCommentData } from "$lib/redditTypes";

	export let data: RedditCommentData;
</script>

<div class="pane">
	<div class="header">
		<a href={`https://reddit.com/r/${data.subreddit}`} target="_blank">r/{data.subreddit} </a>
		<span>by </span>
		<a href={`https://reddit.com/u/${data.author}`} target="_blank">u/{data.author} </a>
		<span>at </span>
		<span>{new Date(data.created_utc * 1000).toISOString().replace(/\.000/g, "")}</span>
		<span> | </span>
		<span>{data.score} 🠉</span>
	</div>
	<div class="body long-text">
		{@html data.body_html}
	</div>
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

	.reddit-link {
		display: flex;
		flex-direction: row;
		margin-top: 0.5rem;

		> * {
			white-space: nowrap;
			font-size: 0.8rem;
		}
	}

	.body {
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
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
