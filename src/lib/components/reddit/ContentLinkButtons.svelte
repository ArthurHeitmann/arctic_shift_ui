<script lang="ts">
	import "$lib/default.scss";
	import PresetSvg from "../icons/PresetSvg.svelte";

	interface Props {
		redditPermalink: string;
		archiveId: string;
	}

	let { redditPermalink, archiveId }: Props = $props();
</script>

<div class="link-buttons">
	<a href={`https://www.reddit.com${redditPermalink}`} target="_blank" class="link-button">
		<PresetSvg name="link" size={12} />
		<span>Reddit</span>
	</a>
	<a href={`/search?ids=${archiveId}&fun=ids`} target="_blank" class="link-button">
		<PresetSvg name="link" size={12} />
		<span>Archive</span>
	</a>
</div>

<style lang="scss">
	.link-buttons {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
	}

	.link-button {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		text-decoration: none;
		color: var(--link-color);
		opacity: 0.7;
		background: transparent;
		transition: background 0.15s ease, opacity 0.15s ease;

		&:hover {
			background: rgba(128, 128, 128, 0.1);
			opacity: 1;
		}

		span {
			font-size: 0.8rem;
		}
	}
</style>
