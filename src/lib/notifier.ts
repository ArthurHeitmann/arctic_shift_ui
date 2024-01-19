
export class Notifier<T=any> {
	private listeners: ((arg: T) => void)[] = [];

	addListener(callback: (arg: T) => void): void {
		this.listeners.push(callback);
	}

	removeListener(callback: (arg: T) => void): void {
		this.listeners = this.listeners.filter(listener => listener !== callback);
	}

	removeAllListeners(): void {
		this.listeners = [];
	}

	notify(arg: T): void {
		for (const listener of this.listeners) {
			try {
				listener(arg);
			}
			catch (err) {
				console.error(err);
			}
		}
	}
}
