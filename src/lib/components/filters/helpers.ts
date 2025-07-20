import { FILTERABLE_PROPERTY_TYPES } from '$lib/constant/index.js';
import { PropertyType, type Filter, type FilterConfig, type View } from '@prisma/client';

type Target = {
	id: string;
	value: string;
};

export function isFilterSeletect(filters: Filter[], target: Target) {
	const filter = filters.find((f) => f.id === target.id);
	if (!filter) return false;
	return filter.values.includes(target.value);
}

type Source = Target & {
	type: PropertyType;
};

export function toggleFilter(filters: Filter[], src: Source) {
	const target = filters.find((f) => f.id === src.id);
	const { id, value, type } = src;

	if (!target) return [...filters, { id, values: [value] }];

	if (type === PropertyType.CHECKBOX) {
		return filters.map((filter) => (filter.id !== id ? filter : { ...target, values: [value] }));
	} else if (FILTERABLE_PROPERTY_TYPES.includes(type)) {
		if (!target.values.includes(value)) {
			return filters.map((filter) =>
				filter.id !== id ? filter : { ...filter, values: [...target.values, value] }
			);
		} else {
			if (target.values.length === 1) return filters.filter((filter) => filter.id !== id);

			const values = target.values.filter((vl) => vl !== value);

			return filters.map((filter) => (filter.id !== id ? filter : { ...filter, values }));
		}
	}

	return [];
}

export function getFilters(filterConfigs: FilterConfig[], view: View) {
	const config = filterConfigs.find((cfg) => cfg.view === view);
	if (!config) return [];
	return config.filters;
}
