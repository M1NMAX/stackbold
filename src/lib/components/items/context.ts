import type { Item } from '@prisma/client';
import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

const ITEM_CTX = 'ITEM_CTX';

export function setActiveItemState(initialData: Item | null) {
	const itemState = writable(initialData);
	setContext(ITEM_CTX, itemState);
	return itemState;
}

export function getActiveItemState() {
	return getContext<Writable<Item | null>>(ITEM_CTX);
}
