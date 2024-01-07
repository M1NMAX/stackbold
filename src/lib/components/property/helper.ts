import type { Color, Property, PropertyRef, Option } from '@prisma/client';

export function getPropertyRef(properties: PropertyRef[], pid: string) {
	return properties.find((property) => property.id === pid) || null;
}

export function getPropertyValue(property: Property, refValue: string, actual: boolean = true) {
	if (property.type !== 'SELECT') return refValue;
	const option = property.options.find((opt) => opt.id === refValue);

	if (!option) return '';

	if (actual) return option.value;
	return option.id;
}

export function getPropertyColor(property: Property, value: string) {
	if (property.type !== 'SELECT') return 'GRAY' as Color;
	const option = property.options.find((opt) => opt.id === value);
	return option ? option.color : ('GRAY' as Color);
}

// TODO: take another look, tip: remove  the non-null assertion operator !
export function getOption(options: Option[], id: string) {
	return options.find((opt) => opt.id === id)!;
}
