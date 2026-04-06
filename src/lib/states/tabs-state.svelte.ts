import type { WritableBox } from '$lib/types';
import { getContext, setContext } from 'svelte';

interface TabsStateOpts {
	value: WritableBox<string>;
}

class TabsState {
	readonly opts: TabsStateOpts;

	constructor(opts: TabsStateOpts) {
		this.opts = opts;
	}

	setValue(value: string) {
		this.opts.value.current = value;
	}

	isSelected(value: string) {
		return this.opts.value.current == value;
	}
}

const TABS_CTX_KEY = Symbol('TABS_CTX_KEY');

export function setTabsState(opts: TabsStateOpts) {
	return setContext(TABS_CTX_KEY, new TabsState(opts));
}

export function getTabsState() {
	return getContext<ReturnType<typeof setTabsState>>(TABS_CTX_KEY);
}
