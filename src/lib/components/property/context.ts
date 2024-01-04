import { getContext, setContext } from 'svelte';
import { type Writable, writable } from 'svelte/store';

const OUTSIDE_CLICK_CTX = Symbol('OUTSIDE_CLICK_CTX');

export function setOutsideClickState(initial: boolean) {
	const outsideClickState = writable(initial);
	setContext(OUTSIDE_CLICK_CTX, outsideClickState);
	return outsideClickState;
}

export function getOutsideClickState() {
	return getContext<Writable<boolean>>(OUTSIDE_CLICK_CTX);
}
