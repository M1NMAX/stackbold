import type { Item, PropertyRef } from '@prisma/client';

export function groupItemsByPropertyValue(pid: string) {
	function getProperty(properties: PropertyRef[], id: string) {
		return properties.find((property) => property.id === id) || null;
	}

	type Group = Record<string, { pid: string; items: Item[] }>;
	return function (groupedItems: Group, item: Item) {
		const property = getProperty(item.properties, pid);

		const key = property ? property.value : 'no-group';

		if (!groupedItems[key]) groupedItems[key] = { pid, items: [] };

		groupedItems[key].items.push(item);

		return groupedItems;
	};
}
