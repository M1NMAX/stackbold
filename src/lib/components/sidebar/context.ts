import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

const SIDEBAR_CTX = Symbol('sidebarcontext');
export function setSidebarState() {
	const sidebarState = writable(true);
	setContext(SIDEBAR_CTX, sidebarState);
	return sidebarState;
}

export function getSidebarState() {
	return getContext<Writable<boolean>>(SIDEBAR_CTX);
}
