import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { Collection } from '@prisma/client';
import type { Searchable } from '$lib/types';

export const load: LayoutServerLoad = async (event) => {
	const user = event.locals.user;

	if (!user) redirect(302, '/signin');

	if (!user.emailVerified) redirect(302, '/email-verification');

	async function getItems(collections: Collection[]) {
		let searchableItems: Searchable[] = [];
		for (const collection of collections) {
			const items = await router.createCaller(await createContext(event)).items.list(collection.id);

			const tp = items.map<Searchable>((item) => ({
				type: 'item',
				id: item.id,
				name: item.name,
				updatedAt: item.updatedAt,
				collection: { name: collection.name, id: collection.id }
			}));

			searchableItems.push(...tp);
		}

		return searchableItems;
	}

	const groups = await router.createCaller(await createContext(event)).groups.list();
	const collections = await router.createCaller(await createContext(event)).collections.list();

	const items = await getItems(collections);

	return { user, collections, groups, items };
};
