import type { SortOption } from '$lib/utils';
import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

const SORT_CTX = 'SORT_CTX';

export function setSortState<T>(initialData: SortOption<T>) {
	const sortState = writable(initialData);
	setContext(SORT_CTX, sortState);
	return sortState;
}

export function getSortState<T>() {
	return getContext<Writable<SortOption<T>>>(SORT_CTX);
}
