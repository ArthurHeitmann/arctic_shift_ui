import { sleep } from "$lib/utils";
import { Notifier } from "$lib/notifier";
import { Stopwatch } from "./stopwatch";

export class ArchiveStream<T> {
	private url: string;
	private abortController: AbortController|null = null;
	private fileHandle: FileSystemFileHandle;
	private fileStream: FileSystemWritableFileStream|null = null;
	private lastFlushAt: number = 0;
	private repeatedErrorCount: number = 0;
	private onStopped: (() => void)|null = null;
	startDate: number;
	currentDate: number;
	isRunning: boolean = false;
	isDone: boolean = false;
	hasError: boolean = false;
	onNewData: Notifier<T[]>;
	onStateChange: Notifier<void>;
	runningSw: Stopwatch;
	
	constructor(url: string, startDate: number, fileHandle: FileSystemFileHandle) {
		this.url = url;
		this.startDate = startDate;
		this.currentDate = startDate;
		this.fileHandle = fileHandle;
		this.onNewData = new Notifier();
		this.onStateChange = new Notifier();
		this.runningSw = new Stopwatch();
	}

	async start() {
		this.isRunning = true;
		this.onStateChange.notify();
		this.fileStream = await this.createWritableStream(false);
		this.run();
	}

	async tryAgain() {
		this.isDone = false;
		this.isRunning = true;
		this.onStateChange.notify();
		this.fileStream = await this.createWritableStream(true);
		this.run();
	}

	resume() {
		this.isRunning = true;
		this.onStateChange.notify();
		this.run();
	}

	pause(): Promise<void> {
		return new Promise(async (resolve, reject) => {
			const isRunning = this.isRunning;
			if (isRunning)	
				this.onStopped = resolve;
			this.isRunning = false;
			this.onStateChange.notify();
			this.abortController?.abort();
			await this.flush();
			if (!isRunning)
				resolve();
		});
	}

	async cancel() {
		this.pause();
		await this.fileStream?.close();
	}

	private async run() {
		this.runningSw.start();
		while (this.isRunning && !this.isDone) {
			try {
				await this.fetchData();
				this.repeatedErrorCount = 0;
				if (this.hasError) {
					this.hasError = false;
					this.onStateChange.notify();
				}
				await sleep(75);
			} catch (e) {
				console.error(e);
				if (!this.hasError) {
					this.hasError = true;
					this.onStateChange.notify();
				}
				this.repeatedErrorCount++;
				if (0.5*Math.pow(this.repeatedErrorCount, 2) > 60) {
					this.isDone = true;
					this.isRunning = false;
					this.repeatedErrorCount = 0;
					this.onStateChange.notify();
					await this.fileStream?.close();
				}
				else
					await sleep(this.repeatedErrorCount * 1000);
			}
		}
		this.runningSw.stop();
		if (this.onStopped)
			this.onStopped();
	}

	private async fetchData() {
		if (!this.fileStream)
			throw new Error("File stream not initialized");
		this.abortController = new AbortController();
		const response = await fetch(`${this.url}&limit=100&sort=asc&after=${this.currentDate}&meta-app=download-tool`, {
			signal: this.abortController?.signal,
		});
		const data = await response.json();
		if (data.error || !data.data)
			throw new Error(data.error || "No data returned");
		if (data.data.length === 0) {
			this.isDone = true;
			this.isRunning = false;
			this.onStateChange.notify();
			await this.fileStream?.close();
			return;
		}
		let newDate = data.data[data.data.length - 1].created_utc * 1000;
		if (newDate === this.currentDate)
			newDate += 1000;
		this.currentDate = newDate;
		this.onNewData.notify(data.data);
		this.writeToFile(data.data);
	}

	private async writeToFile(data: T[]) {
		if (!this.fileStream)
			throw new Error("File stream not initialized");
		const encoder = new TextEncoder();
		const str = data.map(d => JSON.stringify(d)).join("\n") + "\n";
		const dataToWrite = encoder.encode(str);
		await this.fileStream.write(dataToWrite);
		await this.flush();
	}

	private async flush() {
		if (!this.fileStream)
			throw new Error("File stream not initialized");
		const now = Date.now();
		if (now - this.lastFlushAt < 60_000)
			return;
		await this.fileStream.close();
		this.fileStream = null;
		this.fileStream = await this.createWritableStream(true);
		this.lastFlushAt = now;
		console.log(`Flush took ${Date.now() - now}ms`);
	}

	private async createWritableStream(append: boolean) {
		if (!this.fileHandle)
			throw new Error("File handle not initialized");
		const fileStream = await this.fileHandle.createWritable({
			keepExistingData: append,
		});
		if (append) {
			const size = (await this.fileHandle.getFile()).size;
			await fileStream.seek(size);
		}
		return fileStream;
	}
}
