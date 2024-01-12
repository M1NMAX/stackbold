import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

const VIEW_CTX = 'VIEW_CTX';

export function setViewState<T>(initial: T) {
	const viewState = writable(initial);
	setContext(VIEW_CTX, viewState);
	return viewState;
}

export function getViewState<T>() {
	return getContext<Writable<T>>(VIEW_CTX);
}
