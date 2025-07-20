import {
	DEFAULT_STRING_DELIMITER,
	NUMBERICAL_PROPERTY_TYPES,
	PROPERTIES_WITH_LISTABLE_OPTIONS
} from '$lib/constant/index.js';
import type { SelectOption } from '$lib/types';
import {
	Color,
	type Property,
	type PropertyRef,
	type Option,
	PropertyType,
	type View,
	type TemplateProperty
} from '@prisma/client';

export function getPropertyRef(properties: PropertyRef[], pid: string) {
	return properties.find((property) => property.id === pid) || null;
}

export function getRefValue(refs: PropertyRef[], pid: string) {
	const ref = getPropertyRef(refs, pid);
	return ref ? ref.value : '';
}

export function getPropertyColor(property: Property | TemplateProperty, value: string) {
	if (!hasOptions(property.type)) return Color.GRAY;
	const option = property.options.find((opt) => opt.id === value);
	return option ? option.color : Color.GRAY;
}

export function getOption(options: Option[], id: string) {
	return options.find((opt) => opt.id === id) || null;
}

export function containsView(propertyViews: View[], view: View) {
	return propertyViews.some((v) => v === view);
}

export function toggleView(propertyViews: View[], view: View) {
	if (containsView(propertyViews, view)) return propertyViews.filter((v) => v !== view);
	else return [...propertyViews, view];
}

export function hasOptions(type: PropertyType) {
	return PROPERTIES_WITH_LISTABLE_OPTIONS.includes(type);
}

export function isPropertyNumerical(property: Property) {
	if (NUMBERICAL_PROPERTY_TYPES.includes(property.type)) return true;
	if (property.type === PropertyType.BUNDLE) {
		const select = property.options.find((opt) => opt.id === property.extTargetProperty);
		return select ? NUMBERICAL_PROPERTY_TYPES.includes(select.extra as PropertyType) : false;
	}

	return false;
}

export function joinMultiselectOptions(options: SelectOption[]) {
	return options.map((option) => option.id).join(DEFAULT_STRING_DELIMITER);
}

export function separateMultiselectOptions(value: string) {
	return value.split(DEFAULT_STRING_DELIMITER);
}
