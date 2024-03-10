<script lang="ts">
	interface Option<T> {
		value: T;
		label: string;
	}
	export let options: Option<any>[];
	export let selected: any|null = null;
	export let label: string = "";
	export let canDeselect: boolean = false;
	export let expand: boolean = false;
	export let column = true;
	export let stretchRow = true;

	function select(option: Option<any>) {
		selected = option.value;
	}

	function deselect() {
		selected = null;
	}
</script>

<div
	class="option-selector-wrapper"
	class:column
	class:stretchRow={!column && stretchRow}
>
	{#if label}
		<div class="label">
			{label}
		</div>
	{/if}
	<div
		class="option-selector"
		class:expanded={expand}
	>
		{#each options as option}
			<button
				class="option"
				class:selected={selected === option.value}
				on:click={canDeselect && option.value === selected ? deselect : () => select(option)}
			>{option.label}</button>
		{/each}
	</div>
</div>

<style lang="scss">
	.option-selector-wrapper {
		display: flex;

		&.column {
			flex-direction: column;

			.label {
				margin-left: 0.5rem;
				margin-top: 0.75rem;
				margin-bottom: 0.25rem;
			}
		}

		&:not(.column) {
			flex-direction: row;
			align-items: center;

			.label {
				margin-right: 1.5rem;
			}
		}

		&.stretchRow {
			justify-content: space-between;
		}
	}

	.label {
		font-size: 0.8rem;
		user-select: none;
	}

	.option-selector {
		display: flex;
		flex-direction: row;
		@media (max-width: 600px) {
			flex-wrap: wrap;
		}

		&.expanded {
			width: 100%;

			.option {
				flex: 1;
			}
		}

		.option {
			height: 2rem;
			line-height: 2rem;
			padding: 0 0.75rem;
			background: var(--bg-el2-color);
			transition: background 0.25s ease;
			border: 1px solid var(--border-color);
			cursor: pointer;
			--border-radius: 0.5rem;

			&:first-child {
				border-top-left-radius: var(--border-radius);
				border-bottom-left-radius: var(--border-radius);
			}

			&:last-child {
				border-top-right-radius: var(--border-radius);
				border-bottom-right-radius: var(--border-radius);
			}

			&:not(:first-child) {
				border-left: none;
			}

			&:hover {
				background: var(--switcher-bg-hover);
			}

			&:active {
				background: var(--switcher-bg-active);
			}

			&.selected {
				background: var(--switcher-bg-selected);

				&:hover {
					background: var(--switcher-bg-selected);
				}

				&:active {
					background: var(--switcher-bg-selected);
				}
			}
		}
	}
</style>