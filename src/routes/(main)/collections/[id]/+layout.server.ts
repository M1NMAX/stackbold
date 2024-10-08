import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const cid = event.params.id;

	return { cid, items: await router.createCaller(await createContext(event)).items.list(cid) };
};
