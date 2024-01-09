import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const id = event.params.id;

	return {
		template: await router.createCaller(await createContext(event)).templates.load(id),
		isModal: false
	};
};
