import type { Colors } from '$lib/types';

export const PROPERTY_COLORS: Colors = {
	GRAY: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-100',
	RED: 'bg-red-500 text-white dark:bg-red-800 dark:text-red-100',
	GREEN: 'bg-green-500 text-white dark:bg-green-800 dark:text-green-100',
	BLUE: 'bg-blue-600 text-white dark:bg-blue-800 dark:text-blue-100',
	YELLOW: 'bg-yellow-400 text-white dark:bg-yellow-500 dark:text-yellow-100',
	ORANGE: 'bg-orange-500 text-white dark:bg-orange-700 dark:text-orange-100'
};

export const DEFAULT_SORT_OPTIONS = [
	{ label: 'Name Ascending', field: 'name', order: 'asc' },
	{ label: 'Name Descending', field: 'name', order: 'desc' },
	{ label: 'Oldest Updated', field: 'updatedAt', order: 'asc' },
	{ label: 'Latest Updated', field: 'updatedAt', order: 'desc' },
	{ label: 'Recently Added', field: 'createdAt', order: 'desc' },
	{ label: 'Oldest Added', field: 'createdAt', order: 'asc' }
];

export const PROPERTY_DEFAULT_VALUE_NOT_DEFINED = 'Not Defined';
