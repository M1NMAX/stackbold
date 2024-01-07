import type { Item, PropertyRef } from '@prisma/client';

// TODO: Remove properties[0], only 'SELECT' and 'CHECKBOX' property type are allowed as group key
export function groupItemsByPropertyValue(pid: string) {
	function getProperty(properties: PropertyRef[], id: string) {
		return properties.find((property) => property.id === id) || properties[0];
	}

	type Group = Record<string, { pid: string; items: Item[] }>;
	return function (groupedItems: Group, item: Item) {
		const { id, value } = getProperty(item.properties, pid);

		if (!groupedItems[value]) groupedItems[value] = { pid: id, items: [] };

		groupedItems[value].items.push(item);

		return groupedItems;
	};
}
