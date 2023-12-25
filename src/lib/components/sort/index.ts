import type { SortOption } from '$lib/utils/sort';

export { default as SortDropdown } from './sort-dropdown.svelte';
export { default as SortArrow } from './sort-arrow.svelte';

export * from './context';

export const sortOptions: SortOption[] = [
	{ label: 'By name (A-Z)', field: 'name', order: 'asc' },
	{ label: 'By name (Z-A)', field: 'name', order: 'desc' },
	{ label: 'By lastest updated', field: 'updatedAt', order: 'asc' },
	{ label: 'By oldest updated', field: 'updatedAt', order: 'desc' },
	{ label: 'By Recently added ', field: 'createdAt', order: 'asc' },
	{ label: 'By oldest added', field: 'createdAt', order: 'desc' }
];
