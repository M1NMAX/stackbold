import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/router';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const cid = event.params.id;

	return {
		cid,
		items: await createCaller(await createContext(event)).items.list(cid),
		properties: await createCaller(await createContext(event)).properties.list(cid)
	};
};
