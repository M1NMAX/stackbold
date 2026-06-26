import type { PageServerLoad } from './$types';
import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/router';

export const load: PageServerLoad = async (event) => {
	const caller = createCaller(await createContext(event));

	const [system, users, collections] = await Promise.all([
		caller.admin.systemSummary(),
		caller.admin.usersSummary(),
		caller.admin.collectionsSummary()
	]);

	return { system, users, collections };
};
