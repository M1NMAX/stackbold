import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/router';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const cid = event.params.id;
	const viewShortIdStr = event.url.searchParams.get('view');
	const viewShortId = viewShortIdStr ? +viewShortIdStr : null;

	const caller = createCaller(await createContext(event));

	const collection = await caller.collections.load(cid);
	if (!collection) error(404, 'Not found');

	const views = await caller.views.list(cid);
	if (!viewShortId || !views.some((v) => v.shortId === viewShortId))
		error(404, 'This view no longer exists');

	const [properties, items] = await Promise.all([
		caller.properties.list(cid),
		caller.items.list({
			collectionId: cid,
			viewShortId
		})
	]);

	return {
		cid,
		viewShortId,
		views,
		properties,
		items
	};
};
