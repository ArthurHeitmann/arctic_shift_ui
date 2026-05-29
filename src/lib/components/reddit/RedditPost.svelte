<script lang="ts">
	import "$lib/default.scss";
	import type { RedditPostData } from "$lib/redditTypes";
    import ContextMenuButton from "../contextMenu/ContextMenuButton.svelte";
    import { type ContextMenuItem } from "../contextMenu/contextMenuTypes";
	import DateDisplay from "../DateDisplay.svelte";
	import PresetSvg from "../icons/PresetSvg.svelte";
	import ContentLinkButtons from "./ContentLinkButtons.svelte";
	import RedditAuthorLink from "./RedditAuthorLink.svelte";
	import RedditImagePreview from "./RedditImagePreview.svelte";

	interface Props {
		data: RedditPostData;
		contextMenuItems?: ContextMenuItem[];
		embedded?: boolean;
	}

	let { data, contextMenuItems, embedded = false }: Props = $props();
</script>

<div class:pane={!embedded} class="post-container">
	<div class="header">
		<a href={`https://www.reddit.com/r/${data.subreddit}`} target="_blank">r/{data.subreddit} </a>
		<span>by </span>
		<RedditAuthorLink author={data.author} isOp={false} distinguished={data.distinguished} />
		<span><DateDisplay date={new Date(data.created_utc * 1000)} /></span>
		<span> | </span>
		<span class="score">{data.score}</span> <PresetSvg name="upvote" size={14} />
		<span> | </span>
		<span>{data.num_comments}</span> <PresetSvg name="comment" size={14} />
		<div class="spacer"></div>
		{#if contextMenuItems && contextMenuItems.length > 0}
			<ContextMenuButton items={contextMenuItems} />
		{/if}
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
	<ContentLinkButtons redditPermalink={data.permalink} archiveId={`t3_${data.id}`} />
</div>

<style lang="scss">
	.header {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-wrap: wrap;

		a {
			color: var(--primary);
		}

		.spacer {
			flex: 1;
		}
	}

	.title {
		font-size: 1.5rem;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
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