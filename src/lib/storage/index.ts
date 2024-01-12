import { browser } from '$app/environment';
import { get, writable, type Writable } from 'svelte/store';

export function storage<T>(key: string, initialValue: T): Writable<T> {
	const store = writable(initialValue);
	if (!browser) return store;

	const storedValueStr = localStorage.getItem(key);
	if (storedValueStr) store.set(JSON.parse(storedValueStr));

	store.subscribe((value) => {
		if (value == null) localStorage.removeItem(key);
		else localStorage.setItem(key, JSON.stringify(value));
	});

	window.addEventListener('storage', () => {
		const storedValueStr = localStorage.getItem(key);
		if (!storedValueStr) return;

		const localValue: T = JSON.parse(storedValueStr);
		if (localValue !== get(store)) store.set(localValue);
	});

	return store;
}
