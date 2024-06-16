import type { Color, Property, PropertyRef, Option, PropertyType, View } from '@prisma/client';

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

export function getOption(options: Option[], id: string) {
	return options.find((opt) => opt.id === id) || null;
}

export function getPropertyDefaultValue(propType: PropertyType, defaultValue: string) {
	if (propType === 'SELECT') return defaultValue;
	if (propType === 'CHECKBOX') return 'false';
	return '';
}

export function containsView(propertyViews: View[], view: View) {
	return propertyViews.some((v) => v === view);
}

export function toggleView(propertyViews: View[], view: View) {
	if (containsView(propertyViews, view)) return propertyViews.filter((v) => v !== view);
	else return [...propertyViews, view];
}