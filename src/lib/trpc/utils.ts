import type { Aggregator, Item, Property, PropertyRef, PropertyType } from '@prisma/client';

export function isRelation(property: Property) {
	return property.type === 'RELATION' && property.targetCollection !== '';
}

export function isBundle(property: Property) {
	return property.type === 'BUNDLE' && property.intTargetProperty !== '';
}

const PROPERTY_TYPES_WITHOUT_REF = ['CREATED', 'BUNDLE'];
export function hasRef(type: PropertyType) {
	return !PROPERTY_TYPES_WITHOUT_REF.includes(type);
}

export function aggregatePropertyValue(items: Item[], aggregator: Aggregator, pid: string) {
	if (aggregator === 'COUNT') return items.length;
	else if (aggregator === 'COUNT_EMPTY') {
		return items.reduce((acc, item) => {
			const propertyRef = getPropertyRef(item.properties, pid);
			if (propertyRef == null || propertyRef.value === '') return acc + 1;
			return acc;
		}, 0);
	} else if (aggregator === 'COUNT_NOT_EMPTY') {
		return items.reduce((acc, item) => {
			const propertyRef = getPropertyRef(item.properties, pid);
			if (propertyRef && propertyRef.value !== '') return acc + 1;
			return acc;
		}, 0);
	} else if (aggregator === 'SUM' || aggregator === 'AVG') {
		const sum = items.reduce((acc, curr) => {
			const propertyRef = getPropertyRef(curr.properties, pid);
			const inc = propertyRef ? propertyRef.value : 0;
			return acc + Number(inc);
		}, 0);
		if (aggregator === 'SUM') return sum.toFixed(2);
		return (sum / items.length).toFixed(2);
	}
	return '';
}

export function getPropertyRef(properties: PropertyRef[], pid: string) {
	return properties.find((property) => property.id === pid) || null;
}
