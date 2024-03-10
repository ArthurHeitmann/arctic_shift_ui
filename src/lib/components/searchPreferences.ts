import { browser } from "$app/environment";
import { writable } from "svelte/store";

export enum DateDisplay {
	utc = "utc",
	local = "local",
	relative = "relative",
}

const storage: any = browser ? localStorage : {};

function loadFormLocalStorage<T>(key: string, defaultValue: T) {
	try {
		const prefs = storage["preferences"] || "{}";
		const stored = JSON.parse(prefs)[key];
		if (stored) {
			return JSON.parse(stored) as T;
		}
	} catch (e) {
		console.error(e);
	}
	return defaultValue;
}

function makeSavableStore<T>(key: string, defaultValue: T) {
	const store = writable<T>(loadFormLocalStorage(key, defaultValue));
	store.subscribe((value) => {
		let prefs: any = {};
		try {
			prefs = JSON.parse(storage["preferences"] || "{}");
		} catch (e) {
			console.error(e);
		}
		prefs[key] = JSON.stringify(value);
		storage["preferences"] = JSON.stringify(prefs);
	});
	return store;
}

export const dateDisplay = makeSavableStore<DateDisplay>("dateDisplay", DateDisplay.utc);
export const blurNsfw = makeSavableStore<boolean>("blurNsfw", true);
