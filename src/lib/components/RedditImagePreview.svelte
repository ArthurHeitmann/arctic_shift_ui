<script lang="ts">
    import type { RedditPostData } from "$lib/redditTypes";
	import { blurNsfw } from "./searchPreferences";

	export let data: RedditPostData;
	
	let nsfw = data.over_18;
	$: blur = nsfw && $blurNsfw;
	let hasTriedPreviewFull = false;
	let imgUrl: string = "";
	if (data.preview?.images[0]) {
		const image = data.preview.images[0];
		if (image.resolutions.length > 0) {
			const targetRes = 750 * 750;
			for (const res of image.resolutions) {
				if (res.width * res.height > targetRes) {
					imgUrl = res.url;
					break;
				}
			}
			if (!imgUrl) {
				imgUrl = image.resolutions[image.resolutions.length - 1].url;
			}
		}
		else {
			imgUrl = image.source.url;
			hasTriedPreviewFull = true;
		}
	}
	if (!imgUrl) {
		console.log("No preview");
	}

	function onImageError() {
		if (!hasTriedPreviewFull && data.preview?.images[0]) {
			imgUrl = data.preview.images[0].source.url;
			hasTriedPreviewFull = true;
		}
		else if (data.url != imgUrl) {
			imgUrl = data.url;
		}
		else {
			blur = false;
			console.log("No image");
			console.log(data);
		}
	}
</script>

<div class="preview">
	<img
		src={imgUrl}
		class:blur
		on:error={onImageError}
		alt="preview"
	/>
	{#if blur}
		<button class="blur-button" on:click={() => blur = false}>Show NSFW</button>
	{/if}
</div>

<style lang="scss">
	.preview {
		position: relative;
		overflow: hidden;
		border-radius: 1rem;
		
		img {
			max-width: 10rem;
			max-height: 10rem;
			margin-left: 0.5rem;
			filter: blur(0px);
			transition: filter 0.25s ease;
			border-radius: 1rem;

			&.blur {
				filter: blur(15px);
			}
		}

		.blur-button {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: transparent;
			color: white;
			text-shadow: 0 0 8px black, 0 0 16px rgba(0, 0, 0, 0.5);
			display: flex;
			justify-content: center;
			align-items: center;
			cursor: pointer;
		}
	}
</style>