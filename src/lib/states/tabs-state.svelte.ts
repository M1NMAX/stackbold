import type { OnChangeFn } from '$lib/types';
import { getContext, setContext } from 'svelte';

class TabsState {
	value = $state('');
	onchange?: OnChangeFn<string>;

	constructor(value?: string, onchange?: OnChangeFn<string>) {
		this.value = value ?? '';
		this.onchange = onchange;
	}

	setValue(value: string) {
		this.value = value;
		this.onchange?.(value);
	}

	isSelected(value: string) {
		return this.value == value;
	}
}

const TABS_CTX_KEY = Symbol('TABS_CTX_KEY');

export function setTabsState(value?: string, onchange?: OnChangeFn<string>) {
	return setContext(TABS_CTX_KEY, new TabsState(value, onchange));
}

export function getTabsState() {
	return getContext<ReturnType<typeof setTabsState>>(TABS_CTX_KEY);
}
