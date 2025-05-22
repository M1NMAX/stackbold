import type { PageServerLoad } from './$types';
import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/router';

export const load: PageServerLoad = async (event) => {
	const id = event.params.id;

	return {
		items: await createCaller(await createContext(event)).items.list(id),
		properties: await createCaller(await createContext(event)).properties.list(id)
	};
};
