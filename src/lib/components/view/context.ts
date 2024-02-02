import { getContext, setContext } from 'svelte';
import { writable, type Readable, type Writable } from 'svelte/store';

const VIEW_CTX = 'VIEW_CTX';

export function setViewState<T>(initial: T) {
	const viewState = writable(initial);
	setContext(VIEW_CTX, viewState);
	return viewState;
}

export function getViewState<T>() {
	return getContext<Writable<T>>(VIEW_CTX);
}

const SCREEN_CTX = Symbol('SCREEN_CTX');
export function setScreenState(value: Readable<boolean>) {
	setContext(SCREEN_CTX, value);

	return value;
}

export function getScreenState() {
	return getContext<Readable<boolean>>(SCREEN_CTX);
}
