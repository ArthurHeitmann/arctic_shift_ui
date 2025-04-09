<script lang="ts">
	import "$lib/default.scss";
	import OptionSelector from "$lib/components/OptionSelector.svelte";
	import { blurNsfw, dateDisplay, DateDisplay } from "$lib/components/searchPreferences";
</script>

<div class="preferences pane">
	<OptionSelector
		options={[
			{ value: DateDisplay.utc, label: "UTC" },
			{ value: DateDisplay.local, label: "Local" },
			{ value: DateDisplay.relative, label: "Relative" },
		]}
		label="Date format"
		bind:selected={$dateDisplay}
		column={false}
	/>
	<OptionSelector
		options={[
			{ value: false, label: "No" },
			{ value: true, label: "Yes" }
		]}
		label="Blur NSFW images"
		bind:selected={$blurNsfw}
		column={false}
	/>
</div>

<style lang="scss">
	.preferences {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: min(100%, 50rem);
		margin: 1rem auto;
		padding: 1rem;
		font-size: 1.2rem;
	}

	.row {
		display: flex;
		flex-direction: row;
		@media (max-width: 600px) {
			flex-direction: column;
		}
		gap: .5rem;
		width: 100%;
	
		> :global(*) {
			flex: 1;
		}
	}

	.gap {
		height: 1rem;
	}
</style>
