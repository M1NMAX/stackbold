import type { Property, PropertyType } from '@prisma/client';

export function isRelation(property: Property) {
	return property.type === 'RELATION' && property.targetCollection !== '';
}
export function hasRef(type: PropertyType) {
	return type !== 'CREATED';
}
