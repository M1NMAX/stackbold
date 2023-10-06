import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async (event) => {
	const id = event.params.id;
	const collection = router.createCaller(await createContext(event)).collections.getCollection(id);

	return { collection };
};
