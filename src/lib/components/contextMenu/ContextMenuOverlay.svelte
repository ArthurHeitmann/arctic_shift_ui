<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import ContextMenu from "./ContextMenu.svelte";
	import type { ContextMenuEventDetail } from "./contextMenuTypes";
    import { browser } from "$app/environment";

	let contextMenuVisible = false;
	let contextMenuItems: ContextMenuEventDetail["items"] = [];
	let contextMenuX = 0;
	let contextMenuY = 0;
	let contextId = 0;
	let overlayElement: HTMLDivElement;

	onMount(() => {
		if (!browser)
			return;
		document.addEventListener('contextmenu-show', handleContextMenuShow);
	});

	onDestroy(() => {
		if (!browser)
			return;
		document.removeEventListener('contextmenu-show', handleContextMenuShow);
	});

	function handleContextMenuShow(event: Event) {
		const customEvent = event as CustomEvent<ContextMenuEventDetail>;
		contextMenuItems = customEvent.detail.items;
		contextMenuX = customEvent.detail.x;
		contextMenuY = customEvent.detail.y;
		contextMenuVisible = true;
		contextId += 1;
	}

	function closeContextMenu() {
		contextMenuVisible = false;
	}
</script>

<div bind:this={overlayElement} class="context-menu-overlay">
	<slot />
	
	{#if contextMenuVisible}
		<div class="modal-backdrop" on:pointerdown={closeContextMenu} on:wheel={closeContextMenu} role="presentation"></div>

		{#key `${contextId}`}
			<ContextMenu
				items={contextMenuItems}
				x={contextMenuX}
				y={contextMenuY}
				visible={contextMenuVisible}
				on:close={closeContextMenu}
			/>
		{/key}
	{/if}
</div>

<style lang="scss">
	.context-menu-overlay {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
