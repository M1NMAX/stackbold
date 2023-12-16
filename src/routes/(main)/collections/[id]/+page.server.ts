import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const id = event.params.id;

	return {
		collection: await router.createCaller(await createContext(event)).collections.load(id),
		items: await router.createCaller(await createContext(event)).items.list(id)
	};
};
