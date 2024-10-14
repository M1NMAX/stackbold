import type { PageServerLoad } from './$types';
import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';

export const load: PageServerLoad = async (event) => {
	const id = event.params.id;

	return {
		items: await router.createCaller(await createContext(event)).items.list(id)
	};
};
