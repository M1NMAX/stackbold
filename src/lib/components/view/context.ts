import { getContext, setContext } from 'svelte';
import { writable, type Readable, type Writable } from 'svelte/store';


const SCREEN_CTX = Symbol('SCREEN_CTX');
export function setScreenState(value: Readable<boolean>) {
	setContext(SCREEN_CTX, value);
	return value;
}

export function getScreenState() {
	return getContext<Readable<boolean>>(SCREEN_CTX);
}
