import type { Colors } from '$lib/types';

export * from './icons';

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

export const DEBOUNCE_INTERVAL = 1000;

export const PROPERTIES_PANEL_CTX_KEY = Symbol('PROPERTIES_PANEL_CTX_KEY');
export const ITEM_PANEL_CTX_KEY = Symbol('ITEM_PANEL_CTX_KEY');
export const TEMPLATE_PANEL_CTX_KEY = Symbol('TEMPLATE_PANEL_CTX_KEY');

export const MAX_COLLECTION_NAME_LENGTH = 50;
export const MAX_ITEM_NAME_LENGTH = 200;
export const MAX_GROUP_NAME_LENGTH = 50;
export const MAX_PROPERTY_NUMERIC_LENGTH = 10;
export const MAX_PROPERTY_TEXT_LENGTH = 255;
export const MIN_SEARCHABLE_PROPERTY_SELECT = 5;

export const DEFAULT_FEEDBACK_ERR_MESSAGE = 'Something went wrong :(, try again';

export const LOCALE = 'en-US';

export const WEEK_DAYS: { [key: number]: string } = {
	0: 'Sunday',
	1: 'Monday',
	2: 'Tuesday',
	3: 'Wednesday',
	4: 'Thursday',
	5: 'Friday',
	6: 'Saturday'
};
