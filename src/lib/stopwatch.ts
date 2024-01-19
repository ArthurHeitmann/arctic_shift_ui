import { roundTo } from "./utils";

export class Stopwatch {
	private accumulatedTime: number = 0;
	private runningSince: number|null = null;

	start() {
		this.runningSince = Date.now();
	}

	stop() {
		if (this.runningSince === null)
			return;
		this.accumulatedTime += Date.now() - this.runningSince;
		this.runningSince = null;
	}

	get elapsed() {
		if (this.runningSince === null)
			return this.accumulatedTime;
		return this.accumulatedTime + (Date.now() - this.runningSince);
	}
}
