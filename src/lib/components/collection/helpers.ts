import type { CollectionWithViews } from '$lib/types.js';

export function getCollectionView(collection: CollectionWithViews) {
	if (typeof window === 'undefined') return collection.views[0].shortId;
	const key = `collection-${collection.id}-view`;
	const stored = localStorage.getItem(key);
	const parsed = stored ? JSON.parse(stored) : null;

	if (!parsed || !collection.views.some((v) => v.shortId === parsed)) {
		const defaultShortId = collection.views[0].shortId;
		localStorage.setItem(key, JSON.stringify(defaultShortId));
		return defaultShortId;
	}

	return parsed;
}
