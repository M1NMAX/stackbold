import { DEFAULT_COLLECTION_SHORT_VIEW_ID } from '$lib/constant/index.js';
import type { CollectionWithViews } from '$lib/types.js';

export function getCollectionView(collection: CollectionWithViews) {
	if (typeof window === 'undefined') return DEFAULT_COLLECTION_SHORT_VIEW_ID;

	const key = `collection-${collection.id}-view`;
	const stored = localStorage.getItem(key);
	const parsed = stored ? JSON.parse(stored) : null;

	if (!parsed || !collection.views.some((v) => v.shortId === parsed)) {
		localStorage.setItem(key, JSON.stringify(DEFAULT_COLLECTION_SHORT_VIEW_ID));
		return DEFAULT_COLLECTION_SHORT_VIEW_ID;
	}

	return +parsed;
}
