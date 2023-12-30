import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { Collection } from '@prisma/client';

export const load: LayoutServerLoad = async (event) => {
	const session = await event.locals.auth.validate();

	if (!session) redirect(302, '/signin');

	if (!session.user.emailVerified) {
		redirect(302, '/email-verification');
	}

	async function getItems(collections: Collection[]) {
		type SearchableItem = { id: string; name: string; collection: { id: string; name: string } };

		let searchableItems: SearchableItem[] = [];
		for (const collection of collections) {
			const items = await router.createCaller(await createContext(event)).items.list(collection.id);

			const tp = items.map<SearchableItem>((item) => ({
				id: item.id,
				name: item.name,
				collection: { name: collection.name, id: collection.id }
			}));

			searchableItems.push(...tp);
		}

		return searchableItems;
	}

	const user = session.user;

	const groups = await router.createCaller(await createContext(event)).groups.list();
	const collections = await router.createCaller(await createContext(event)).collections.list();

	const items = await getItems(collections);

	return { user, collections, groups, items };
};
