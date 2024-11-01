import { getContext, setContext } from 'svelte';

export class ActiveItemState {
	id = $state('');

	constructor(id: string = '') {
		this.id = id;
	}

	update(id: string) {
		this.id = id;
	}
	reset() {
		this.id = '';
	}
}

const ACTIVE_ITEM_CTX_KEY = Symbol('ACTIVE_ITEM_CTX_KEY');

export function setActiveItemState() {
	return setContext(ACTIVE_ITEM_CTX_KEY, new ActiveItemState(''));
}

export function getActiveItemState() {
	return getContext<ReturnType<typeof setActiveItemState>>(ACTIVE_ITEM_CTX_KEY);
}
