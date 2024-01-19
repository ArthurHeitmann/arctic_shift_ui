
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
