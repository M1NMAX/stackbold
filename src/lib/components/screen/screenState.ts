import { getContext, setContext } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';

const SCREEN_SIZE_CTX = Symbol('SCREEN_SIZE_CTX');
export function setScreenSizeState() {
	const query = 'min-width: 768px';
	return setContext(SCREEN_SIZE_CTX, new MediaQuery(query, false));
}

export function getScreenSizeState() {
	return getContext<ReturnType<typeof setScreenSizeState>>(SCREEN_SIZE_CTX);
}
