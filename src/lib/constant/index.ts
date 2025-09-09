import type { Colors } from '$lib/types';
import { Aggregator, PropertyType } from '@prisma/client';

export * from './icons';

export const PROPERTY_COLORS: Colors = {
	GRAY: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100',
	RED: 'bg-red-500 text-white dark:bg-red-800 dark:text-red-100',
	GREEN: 'bg-green-500 text-white dark:bg-green-800 dark:text-green-100',
	BLUE: 'bg-blue-600 text-white dark:bg-blue-800 dark:text-blue-100',
	YELLOW: 'bg-yellow-400 text-white dark:bg-yellow-500 dark:text-yellow-100',
	ORANGE: 'bg-orange-500 text-white dark:bg-orange-700 dark:text-orange-100'
};

export const PROPERTY_AGGREGATOR_LABELS: { [key: string]: string } = {
	none: 'None',
	count: 'Count all',
	count_empty: 'Count empty',
	count_not_empty: 'Count not empty',
	avg: 'Average',
	sum: 'Sum'
};

export const DEFAULT_SORT_OPTIONS = [
	{ label: 'Name Ascending', field: 'name', order: 'asc' },
	{ label: 'Name Descending', field: 'name', order: 'desc' },
	{ label: 'Oldest Updated', field: 'updatedAt', order: 'asc' },
	{ label: 'Latest Updated', field: 'updatedAt', order: 'desc' },
	{ label: 'Recently Added', field: 'createdAt', order: 'desc' },
	{ label: 'Oldest Added', field: 'createdAt', order: 'asc' }
];

export const DEFAULT_STRING_DELIMITER = '|';

export const VALUE_NOT_DEFINED = 'Not Defined';
export const VALUE_NONE = 'None';

export const DEBOUNCE_INTERVAL = 1000;

export const COLLECTION_PAGE_PANEL_CTX_KEY = Symbol('COLLECTION_PAGE_PANEL_CTX_KEY');
export const TEMPLATE_PANEL_CTX_KEY = Symbol('TEMPLATE_PANEL_CTX_KEY');
export const MAX_VISIBLE_VIEWS_TAB = 3;
export const MAX_COLLECTION_NAME_LENGTH = 50;
export const MAX_VIEW_NAME_LENGTH = 50;
export const MAX_ITEM_NAME_LENGTH = 200;
export const MAX_GROUP_NAME_LENGTH = 50;
export const MAX_PROPERTY_NUMERIC_LENGTH = 10;
export const MAX_PROPERTY_TEXT_LENGTH = 255;
export const MAX_PROPERTY_TEXT_OVERVIEW_LENGTH = 30;
export const MIN_SEARCHABLE_PROPERTY_SELECT = 2;
export const ITEMS_CHUNK_SIZE = 25;

export const DEFAULT_FEEDBACK_ERR_MESSAGE = 'Something went wrong :(, try again';

export const NAME_FIELD = 'name';

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

export const SCREEN_MD_MEDIA_QUERY = 'min-width: 768px';

export const NUMBERICAL_PROPERTY_TYPES: PropertyType[] = [PropertyType.NUMBER];

export const PROPERTIES_THAT_USE_INPUT: PropertyType[] = [
	PropertyType.TEXT,
	PropertyType.NUMBER,
	PropertyType.URL
];

export const PROPERTIES_WITH_LISTABLE_OPTIONS: PropertyType[] = [
	PropertyType.SELECT,
	PropertyType.MULTISELECT
];

export const PROPERTIES_THAT_USE_SELECTOR: PropertyType[] = [
	...PROPERTIES_WITH_LISTABLE_OPTIONS,
	PropertyType.RELATION
];

export const FILTERABLE_PROPERTY_TYPES: PropertyType[] = [
	...PROPERTIES_THAT_USE_SELECTOR,
	PropertyType.CHECKBOX
];

export const PROPERTIES_THAT_CAN_HAVE_DEFAULT_VALUE: PropertyType[] = [
	...PROPERTIES_THAT_USE_SELECTOR,
	PropertyType.CHECKBOX
];

export const PROPERTIES_WITHOUT_REF: PropertyType[] = [PropertyType.CREATED, PropertyType.BUNDLE];

export const PROPERTY_UNIVERSAL_AGGREGATORS: Aggregator[] = [
	Aggregator.COUNT,
	Aggregator.COUNT_EMPTY,
	Aggregator.COUNT_NOT_EMPTY
];
export const NUMBERICAL_PROPERTY_EXCLUSIVE_AGGREGATORS: Aggregator[] = [
	Aggregator.SUM,
	Aggregator.AVG
];
