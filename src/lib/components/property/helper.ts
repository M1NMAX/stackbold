import type { SelectOption } from '$lib/types';
import type {
	Color,
	Property,
	PropertyRef,
	Option,
	PropertyType,
	View,
	TemplateProperty
} from '@prisma/client';

export function getPropertyRef(properties: PropertyRef[], pid: string) {
	return properties.find((property) => property.id === pid) || null;
}

export function getPropertyColor(property: Property | TemplateProperty, value: string) {
	if (!hasOptions(property.type)) return 'GRAY' as Color;
	const option = property.options.find((opt) => opt.id === value);
	return option ? option.color : ('GRAY' as Color);
}

export function getOption(options: Option[], id: string) {
	return options.find((opt) => opt.id === id) || null;
}

export function getPropertyDefaultValue(property: Property) {
	if (hasOptions(property.type)) return property.defaultValue;
	if (property.type === 'CHECKBOX') return 'false';
	return '';
}

export function containsView(propertyViews: View[], view: View) {
	return propertyViews.some((v) => v === view);
}

export function toggleView(propertyViews: View[], view: View) {
	if (containsView(propertyViews, view)) return propertyViews.filter((v) => v !== view);
	else return [...propertyViews, view];
}

const PROPERTY_THAT_USES_SELECTOR = ['SELECT', 'MULTISELECT', 'RELATION'];
export function useSelector(type: PropertyType) {
	return PROPERTY_THAT_USES_SELECTOR.includes(type);
}

export function hasOptions(type: PropertyType) {
	return type === 'SELECT' || type === 'MULTISELECT';
}

export function isNumerical(type: PropertyType) {
	return type === 'NUMBER';
}

export function joinMultiselectOptions(options: SelectOption[]) {
	return options.map((option) => option.id).join('|');
}

export function separateMultiselectOptions(value: string) {
	return value.split('|');
}
