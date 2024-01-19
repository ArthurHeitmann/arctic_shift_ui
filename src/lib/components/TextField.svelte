<script lang="ts">
	import "$lib/default.scss";
	
	export let text: string;
	export let label: string = "";
	export let placeholder: string = "";
	export let type: string = "text";
	export let min: string = "";
	export let max: string = "";
	export let transform: ((text: string) => string)|null = null;
	export let getError: (text: string) => string|null = () => null;
	export let onChange: ((text: string) => void)|null = null;

	let error: string|null = null;

	function onTextChange(e: Event) {
		const target = e.target as HTMLInputElement;
		let newText = target.value;
		if (transform)
			newText = transform(newText);
		error = getError(newText);
		if (error)
			return;
		text = newText;
		if (onChange)
			onChange(text);
	}
</script>

<label class="text-field">
	{#if label}
		<div class="label">
			{label}
		</div>
	{/if}
	<div class="input-wrapper">
		<input
			class="text-input"
			value={text}
			type={type}
			placeholder={placeholder}
			min={min}
			max={max}
			on:change={onTextChange}
		/>
		<div
			class="error"
			class:transparent={!error}
		>{error || ""}</div>
	</div>
</label>

<style lang="scss">
	.text-field {
	  display: flex;
	  flex-direction: column;
	//   border: 1px solid lightblue;

	  .label {
		font-size: 0.8rem;
		margin-left: 0.5rem;
		margin-top: 0.75rem;
		margin-bottom: 0.25rem;
	  }

	  .input-wrapper {
		height: 2rem;
		line-height: 2rem;
	  	padding: 0 0.75rem;
		background: var(--bg-el2-color);
		border: 1px solid var(--border-color);
		border-radius: 1rem;
		position: relative;

		input {
			color-scheme: dark;
			width: 100%;
		}
	  }
	}

	.error {
		position: absolute;
		top: 0;
		right: 1rem;
		color: var(--error);
		font-size: 0.9rem;
	}

	.transparent {
		opacity: 0;
	}
</style>
