import { getContext, setContext } from 'svelte';
import { browser } from '$app/environment';

class SidebarState {
	KEY = 'sidebarstate';
	#first = true;
	#open = $state(false);

	constructor(initial: boolean) {
		this.#open = initial;
	}

	get isOpen() {
		if (!this.#first || !browser) return this.#open;

		const saved = localStorage.getItem(this.KEY);
		if (saved) this.#open = saved === 'true';
		this.#first = false;
		return this.#open;
	}

	set isOpen(v: boolean) {
		if (browser) localStorage.setItem(this.KEY, v.toString());
		this.#open = v;
	}

	open() {
		this.isOpen = true;
	}

	close() {
		this.isOpen = false;
	}
}

const SIDEBAR_CTX = Symbol('SIDEBARSTATE_CTX');
export function setSidebarState() {
	return setContext(SIDEBAR_CTX, new SidebarState(true));
}

export function getSidebarState() {
	return getContext<ReturnType<typeof setSidebarState>>(SIDEBAR_CTX);
}
