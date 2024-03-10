<script lang="ts">
    import { timePassedSince } from "$lib/utils";
	import { DateDisplay, dateDisplay } from "./searchPreferences";

	export let date: Date;
</script>

{#if $dateDisplay === DateDisplay.utc}
	at {date.toISOString().replace(/\.000/g, "")}
{:else if $dateDisplay === DateDisplay.local}
	at {date.toLocaleString()}
{:else if $dateDisplay === DateDisplay.relative}
	{timePassedSince(date.getTime() / 1000)} ago
{:else}
	{date.toISOString().replace(/\.000/g, "")}
{/if}

