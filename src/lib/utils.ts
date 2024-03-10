
export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function roundTo(num: number, precision: number): number {
	const factor = Math.pow(10, precision);
	return Math.round(num * factor) / factor;
}

export function formatDuration(ms: number, showMs = false): string {
	// HH:MM:SS
	let s = Math.floor(ms / 1000);
	const msPart = showMs ? `,${ms % 1000}` : "";
	const secPart = s % 60;
	s = Math.floor(s / 60);
	const minPart = s % 60;
	const hourPart = Math.floor(s / 60);
	return `${hourPart}:${minPart.toString().padStart(2, "0")}:${secPart.toString().padStart(2, "0")}${msPart}`;
}

function _timePassedSinceParts(time: number): { n: number, s: string } {
	const s = Math.round(Date.now() / 1000 - time);
	if (s < 60)
		return { n: s, s: "seconds" };
	else if (s < 3600)
		return { n: Math.floor(s / 60), s: "minutes" };
	else if (s < 86400)
		return { n: Math.floor(s / 3600), s: "hours" };
	else if (s < 2592000)
		return { n: Math.floor(s / 86400), s: "days" };
	else if (s < 31557600)
		return { n: Math.floor(s / 2592000), s: "months" };
	else
		return { n: Math.floor(s / 31557600), s: "years" };
}

function _timePassedSince(time: number): string {
	const { n, s } = _timePassedSinceParts(time);
	return `${n.toString()} ${n !== 1 ? s : s.replace(/s$/, "")}`;		// 1 seconds --> 1 second
}

/**
 * 	1 - 59		 	 1s
 *	60 - 3599	 	 1 - 59m
 *	3600 - 86399	 1 - 23h
 *	86400 - 2591999	 1 - 29d
 *	2592000-31557599 1 - 12mo
 *	1 - ..y
 * @param time in seconds
 */
 export function timePassedSince(time: number, includeAdverb = true, adverb = "ago", absAdverb = "at"): string {
	const timeStr = _timePassedSince(time);
	return includeAdverb ? `${timeStr} ${adverb}` : timeStr;
}
