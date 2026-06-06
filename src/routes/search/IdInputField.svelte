<script lang="ts">
	import "$lib/default.scss";
	import TextField from "$lib/components/TextField.svelte";
	import OptionSelector from "$lib/components/OptionSelector.svelte";
	import { IdCategory, IdInput } from "./IdInput";

	interface Props {
		id: IdInput;
		onChange: ((ids: IdInput[]) => void);
		onRemove?: (() => void)|null;
	}

	let { id, onChange, onRemove = null }: Props = $props();
</script>

<div class="row">
	<OptionSelector
		options={[
			{ value: IdCategory.post, label: "Post" },
			{ value: IdCategory.comment, label: "Comment" },
		]}
		selected={id.category}
		onChange={category => onChange([id.copyWithCategory(category)])}
	/>
	<TextField
		type="text"
		placeholder="IDs or URLs"
		text={id.id}
		onChange={newId => onChange(IdInput.fromIdStringsAssert(newId, id.category))}
		getError={newId => IdInput.fromIdStrings(newId, id.category).some(i => i === null) ? "Invalid ID" : null}
		width="12rem"
	/>
	{#if onRemove}
		<button
			class="remove-button transparent-button"
			aria-label="Remove ID"
			onclick={onRemove}
		>
		</button>
	{/if}
</div>

<style lang="scss">
	.row {
		margin: 0.25rem 0;
		gap: 0.5rem;
		align-items: center;
	}

	.remove-button {
		width: 1.75rem;
		height: 1.75rem;
		background-image: url("$lib/images/close.svg");
		background-size: contain;
	}
</style>
