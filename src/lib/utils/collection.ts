import type { CollectionWithViews, SearchableCollection } from '$lib/types';

export function preSearchData(data: CollectionWithViews[]) {
	return data
		.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
		.map((c) => ({
			id: c.id,
			name: c.name,
			icon: c.icon,
			items: [],
			views: c.views.map((v) => ({ shortId: v.shortId }))
		}));
}

export function applyFilter(data: SearchableCollection[], term: string) {
	const pattern = new RegExp(term, 'i');
	return data
		.filter((e) => pattern.test(e.name) || e.items.some((i) => pattern.test(i.name)))
		.map((e) => ({
			...e,
			items: pattern.test(e.name) ? e.items : e.items.filter((i) => pattern.test(i.name))
		}));
}
