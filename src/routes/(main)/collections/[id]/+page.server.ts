import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const id = event.params.id;

	return {
		collection: router.createCaller(await createContext(event)).collections.load(id),
		items: router.createCaller(await createContext(event)).items.getCollectionItems(id)
	};
};
