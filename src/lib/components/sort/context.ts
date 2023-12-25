import type { SortOption } from '$lib/utils';
import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

const SORT_CTX = 'SORT_CTX';

export function setSortState(initialData: SortOption) {
	const sortState = writable(initialData);
	setContext(SORT_CTX, sortState);
	return sortState;
}

export function getSortState() {
	return getContext<Writable<SortOption>>(SORT_CTX);
}
