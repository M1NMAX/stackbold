import {
	PROPERTIES_THAT_CAN_HAVE_DEFAULT_VALUE,
	PROPERTIES_WITHOUT_REF
} from '$lib/constant/index.js';
import { PropertyType, type Option, type Property, type PropertyRef } from '@prisma/client';

export function isRelation(property: Property) {
	return property.type === PropertyType.RELATION && property.targetCollection != null;
}

export function isBidirectionalRelation(property: Property) {
	return isRelation(property) && property.relatedProperty != null;
}

export function isBundle(property: Property) {
	return (
		property.type === PropertyType.BUNDLE &&
		property.intTargetProperty != null &&
		property.targetCollection != null
	);
}

export function isBundleValueInjectable(property: Property) {
	return isBundle(property) && property.extTargetProperty != null;
}

export function hasRef(type: PropertyType) {
	return !PROPERTIES_WITHOUT_REF.includes(type);
}

export function getPropertyRef(properties: PropertyRef[], pid: string) {
	return properties.find((property) => property.id === pid) || null;
}
export function getPropertyOption(options: Option[], id: string) {
	return options.find((opt) => opt.id === id) || null;
}

export function getPropertyDefaultValue(property: Property) {
	if (!PROPERTIES_THAT_CAN_HAVE_DEFAULT_VALUE.includes(property.type)) return null;
	if (property.type === PropertyType.CHECKBOX) return 'false';
	return property.defaultValue;
}

export function groupBy<T>(items: T[], key: keyof T) {
	return items.reduce((map, item) => {
		const groupKey = item[key] as string;

		if (!map.has(groupKey)) {
			map.set(groupKey, []);
		}

		map.get(groupKey)!.push(item);

		return map;
	}, new Map<string, T[]>());
}
export function compareValues(a: string, b: string) {
	if (a === '' && b === '') return 0;
	if (a === '') return -1;
	if (b === '') return 1;

	const aNum = Number(a);
	const bNum = Number(b);

	if (!isNaN(aNum) && !isNaN(bNum)) {
		return aNum - bNum;
	}

	const aDate = new Date(a);
	const bDate = new Date(b);

	if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
		return aDate.getTime() - bDate.getTime();
	}

	return String(a).localeCompare(String(b));
}
