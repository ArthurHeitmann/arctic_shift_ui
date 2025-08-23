<script lang="ts">
	import type { ContextMenuItem } from "./contextMenuTypes";
	import kebabIcon from "$lib/images/kebab.svg";

	export let items: ContextMenuItem[];
	export let disabled: boolean = false;
	export let className: string = "";

	function handleClick(event: MouseEvent) {
		if (disabled || items.length === 0) return;

		event.preventDefault();
		event.stopPropagation();

		const contextMenuEvent = new CustomEvent('contextmenu-show', {
			detail: {
				items,
				x: event.clientX,
				y: event.clientY
			},
			bubbles: true
		});
		
		document.dispatchEvent(contextMenuEvent);
	}
</script>

<button
	class="context-menu-button {className}"
	class:disabled
	on:click={handleClick}
	{disabled}
>
	<img src={kebabIcon} alt="More options" />
</button>

<style lang="scss">
	.context-menu-button {
		border: none;
		cursor: pointer;
		border-radius: 50%;
		width: 1.7rem;
		height: 1.7rem;
		background: transparent;
		transition: background-color 0.25s ease;
		
		img {
			width: 100%;
			height: 100%;
		}
		
		&:not(.disabled):hover {
			background-color: var(--transparent-btn-hover);
		}

		&:not(.disabled):active {
			background-color: var(--transparent-btn-active);
		}

		&.disabled {
			opacity: 0.5;
			cursor: default;
		}
	}
</style>
