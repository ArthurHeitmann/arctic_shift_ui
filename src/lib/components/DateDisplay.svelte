<script lang="ts">
	import { timePassedSince } from "$lib/utils";
	import { DateDisplay, dateDisplay } from "./searchPreferences";

	interface Props {
		date: Date;
	}

	let { date }: Props = $props();

	let _tick = $state(0);

	const relativeText = $derived.by(() => {
		void _tick;
		return timePassedSince(date.getTime() / 1000);
	});

	function getRelativeUpdateDelayMs(dateMs: number, nowMs: number): number {
		const minuteMs = 60 * 1000;
		const hourMs = 60 * minuteMs;
		const dayMs = 24 * hourMs;
		const ageMs = Math.max(0, nowMs - dateMs);

		if (ageMs < minuteMs) {
			return minuteMs - ageMs;
		}

		if (ageMs < hourMs) {
			return minuteMs - (ageMs % minuteMs);
		}

		if (ageMs < dayMs) {
			return hourMs - (ageMs % hourMs);
		}

		return dayMs - (ageMs % dayMs);
	}

	$effect(() => {
		if ($dateDisplay !== DateDisplay.relative) {
			return;
		}

		void _tick;

		const currentNow = Date.now();
		const delayMs = getRelativeUpdateDelayMs(date.getTime(), currentNow);

		const timeout = window.setTimeout(() => {
			_tick++;
		}, delayMs);

		return () => window.clearTimeout(timeout);
	});
</script>

{#if $dateDisplay === DateDisplay.utc}
	at {date.toISOString().replace(/\.000/g, "")}
{:else if $dateDisplay === DateDisplay.local}
	at {date.toLocaleString()}
{:else if $dateDisplay === DateDisplay.relative}
	{relativeText}
{:else}
	{date.toISOString().replace(/\.000/g, "")}
{/if}
