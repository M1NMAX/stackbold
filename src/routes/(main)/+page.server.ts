import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';
import { router } from '$lib/trpc/router';
import { createContext } from '$lib/trpc/context';
import type { Actions, PageServerLoad } from './$types';
import type { Item } from '@prisma/client';

export const actions: Actions = {
	logout: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401);
		await auth.invalidateSession(session.sessionId); // invalidate session
		locals.auth.setSession(null); // remove cookie
		redirect(302, '/signin'); // redirect to login page
	}
};

export const load: PageServerLoad = async (event) => {
	const { collections } = await event.parent();
	const favCollections = collections.filter((collection) => collection.isFavourite);

	let items: Record<string, Item[]> = {};

	for (const collection of favCollections) {
		const tempItems = await router
			.createCaller(await createContext(event))
			.items.list(collection.id);

		if (!items[collection.id]) items[collection.id] = [];

		items[collection.id].push(...tempItems);
	}

	return { collections: favCollections, items };
};
