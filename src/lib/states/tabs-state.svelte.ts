import { getContext, setContext } from 'svelte';

class TabsState {
	value = $state('');

	constructor(value?: string) {
		this.value = value ?? '';
	}

	setValue(value: string) {
		this.value = value;
	}

	isSelected(value: string) {
		return this.value == value;
	}
}

const TABS_CTX_KEY = Symbol('TABS_CTX_KEY');

export function setTabsState(value?: string) {
	return setContext(TABS_CTX_KEY, new TabsState(value));
}

export function getTabsState() {
	return getContext<ReturnType<typeof setTabsState>>(TABS_CTX_KEY);
}
