<script lang="ts">
	import { getContext } from "svelte";
	import "$lib/default.scss";
	import { COMMENT_TREE_CONTEXT_KEY, type CommentTreeContext, type CommentTreeNode } from "./commentTreeTypes";
	import DateDisplay from "../DateDisplay.svelte";
	import ThreadActionButton from "./ThreadActionButton.svelte";
	import PresetSvg from "../icons/PresetSvg.svelte";
	import ContentLinkButtons from "./ContentLinkButtons.svelte";
	import RedditAuthorLink from "./RedditAuthorLink.svelte";
	import Self from "./CommentNode.svelte";

	interface Props {
		node: CommentTreeNode;
		isRoot?: boolean;
	}

	let { node, isRoot = false }: Props = $props();

	const context = getContext<CommentTreeContext>(COMMENT_TREE_CONTEXT_KEY);

	const data = $derived(node.data);
	const hasChildren = $derived(node.children.length > 0);
	const canLoadMoreChildren = $derived(node.hasMoreChildren || (!node.childrenLoaded && data.parent_id));

	let nodeElement: HTMLElement | undefined = $state();

	$effect(() => {
		context.registerNodeElement(data.id, nodeElement ?? null);
		return () => context.registerNodeElement(data.id, null);
	});
</script>

<div class="comment-node" class:root={isRoot} class:collapsed={node.collapsed} bind:this={nodeElement}>
	<button
		class="collapse-line"
		onclick={() => context.toggleCollapse(data.id)}
		aria-label={node.collapsed ? "Expand comment" : "Collapse comment"}
	></button>
	<div class="comment-main">
		<div class="comment-content">
			<div class="header">
			<a href={`https://www.reddit.com/r/${data.subreddit}`} target="_blank">r/{data.subreddit}</a>
			<span>by</span>
			<RedditAuthorLink
				author={data.author}
				isOp={data.is_submitter}
				distinguished={data.distinguished}
			/>
			<span><DateDisplay date={new Date(data.created_utc * 1000)} /></span>
			<span>|</span>
			<span class="score">{data.score} </span><PresetSvg name="upvote" size={14} />
		</div>
		<div class="body">
			{@html data.body_html}
		</div>
			<ContentLinkButtons redditPermalink={data.permalink} archiveId={`t1_${data.id}`} />
		</div>

		{#if hasChildren}
			<div class="children">
				{#each node.children as child (child.data.id)}
					<Self node={child} />
				{/each}
			</div>
		{/if}

		{#if canLoadMoreChildren}
			<div class="load-more-button">
				<ThreadActionButton
					onclick={() => context.loadChildren(data.id)}
					disabled={node.isLoadingChildren}
				>
					{#if node.isLoadingChildren}
						<span>Loading...</span>
					{:else if node.moreChildrenCount}
						<PresetSvg name="arrow-down" size={14} /> <span>Load {node.moreChildrenCount} more replies</span>
					{:else}
						<PresetSvg name="arrow-down" size={14} /> <span>Load replies</span>
					{/if}
				</ThreadActionButton>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.comment-node {
		display: flex;
		flex-direction: row;

		&.collapsed {
			.comment-main {
				.comment-content {
					.body,
					:global(.link-buttons) {
						display: none;
					}
				}

				.children,
				.load-more-button {
					display: none;
				}
			}
		}
	}

	.comment-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.comment-content {
		padding: 0.25rem 0.75rem;
	}

	.header {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.25rem;

		* {
			font-size: 0.9rem;
		}

		a {
			color: var(--primary);
		}
	}

	.body {
		margin: 0.5rem 0;
	}

	.load-more-button {
		align-self: flex-start;
		margin-top: 0.5rem;
	}

	.collapse-line {
		display: flex;
		flex-direction: column;
		padding-right: 0.25rem;
		align-self: stretch;
		width: 20px;
		position: relative;

		&::before {
			content: "";
			position: absolute;
			left: 50%;
			top: 8px;
			bottom: 0px;
			width: 3px;
			background: var(--comment-collapser-bg);
			transform: translateX(-50%);
			transition: width 0.15s ease;
		}

		&:hover::before {
			width: 6px;
		}
	}

	.children {
		display: flex;
		flex-direction: column;
		margin-top: 0.25rem;
	}
</style>
