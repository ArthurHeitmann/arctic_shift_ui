<script lang="ts">
	import "$lib/default.scss";
	
	export let text: string;
	export let label: string = "";
	export let placeholder: string = "";
	export let type: string = "text";
	export let min: string = "";
	export let max: string = "";
	export let simpleDesign: boolean = false;
	export let width: string|null = null;
	export let transform: ((text: string) => string)|null = null;
	export let getError: (text: string) => string|null = () => null;
	export let onChange: ((text: string) => void)|null = null;
	export let onEnter: (() => void)|null = null;

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

	function onKeyPress(e: KeyboardEvent) {
		if (e.key === "Enter") {
			if (onEnter) {
				onTextChange(e);
				onEnter();
			}
		}
	}
</script>

<label
	class="text-field"
	class:simpleDesign
	class:fancyDesign={!simpleDesign}
	style={width ? `width: ${width}` : ""}
	>
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
			on:keypress={onEnter ? onKeyPress : undefined}
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
			position: relative;

			input {
				color-scheme: dark;
				width: 100%;
			}
		}

		&.simpleDesign {
			.input-wrapper {
				border-bottom: 2px solid var(--border-color);
				transition: border-color 0.2s ease;

				&:focus-within {
					border-bottom: 2px solid var(--primary-faint);
				}
			}
		}

		&.fancyDesign {
			.input-wrapper {
				background: var(--bg-el2-color);
				border: 1px solid var(--border-color);
				border-radius: 1rem;
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
