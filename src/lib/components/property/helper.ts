import type { Color, Property, PropertyRef } from '@prisma/client';

export function getPropertyRef(properties: PropertyRef[], pid: string) {
	return properties.find((property) => property.id === pid) || null;
}

//TODO: investigate the diff between @getPropertyValue and @getOptionValue
export function getPropertyValue(property: Property, refValue: string) {
	if (property.type !== 'SELECT') return refValue;
	const option = property.options.find((opt) => opt.id === refValue);

	return option ? option.value : '';
}

export function getOptionValue(property: Property, value: string) {
	if (property.type !== 'SELECT') return value;
	const option = property.options.find((opt) => opt.id === value);
	return option ? option.id : '';
}

export function getOptionColor(property: Property, value: string) {
	if (property.type !== 'SELECT') return 'GRAY' as Color;
	const option = property.options.find((opt) => opt.id === value);
	return option ? option.color : ('GRAY' as Color);
}
