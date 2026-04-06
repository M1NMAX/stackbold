import { DEFAULT_STRING_DELIMITER, FILTERABLE_PROPERTY_TYPES } from '$lib/constant/index.js';
import type { ItemsGroup, PropertyWithOptions } from '$lib/types.js';
import { getPropertyRef } from '$lib/utils/index.js';
import { PropertyType, type Item } from '@prisma/client';

export function getInitialItemsGroup(property: PropertyWithOptions) {
	if (!FILTERABLE_PROPERTY_TYPES.includes(property.type)) return {};

	let keys = ['', ...property.optionsM.map((o) => o.id)];

	if (property.type === PropertyType.CHECKBOX) {
		keys = ['false', 'true'];
	}

	const groups: ItemsGroup = {};
	for (const key of keys) {
		groups[key] = [];
	}

	return groups;
}

export function groupItemsByPropertyValue(pid: string) {
	return function (groups: ItemsGroup, item: Item) {
		const ref = getPropertyRef(item.properties, pid);
		const key = getFallbackKey(Object.keys(groups), ref ? ref.value : '');

		let keys = [key];
		if (key.includes(DEFAULT_STRING_DELIMITER)) {
			keys = key.split(DEFAULT_STRING_DELIMITER);
		}

		for (const k of keys) {
			if (!groups[k]) groups[k] = [];
			groups[k].push(item);
		}

		return groups;
	};
}

function getFallbackKey(keys: string[], key: string) {
	if (keys.includes(key)) return key;
	if (!keys.includes('')) return keys[0];
	return key;
}
