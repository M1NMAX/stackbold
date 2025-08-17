import { DEFAULT_VIEW_SHORT_ID } from '$lib/constant/index.js';
import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/router';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const cid = event.params.id;
	const viewShortIdStr = event.url.searchParams.get('view');
	const viewShortId = viewShortIdStr ? +viewShortIdStr : DEFAULT_VIEW_SHORT_ID;

	return {
		cid,
		viewShortId,
		views: await createCaller(await createContext(event)).views.list(cid),
		properties: await createCaller(await createContext(event)).properties.list(cid),
		items: await createCaller(await createContext(event)).items.list({
			collectionId: cid,
			viewShortId
		})
	};
};
