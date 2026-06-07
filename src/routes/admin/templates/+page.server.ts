import type { PageServerLoad } from './$types';
import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/router';

export const load: PageServerLoad = async (event) => {
	const caller = createCaller(await createContext(event));

	return { templates: await caller.templates.list() };
};
