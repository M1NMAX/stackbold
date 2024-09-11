import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: LayoutServerLoad = async (event) => {
	const user = event.locals.user;

	if (!user) redirect(302, '/signin');

	if (!user.emailVerified) redirect(302, '/email-verification');

	async function getItems(userId: string) {
		try {
			const start = Date.now();
			const result = await prisma.item.findMany({
				where: { collection: { ownerId: userId } },
				include: { collection: { select: { id: true, name: true } } }
			});
			const ms = Date.now() - start;
			console.log(`OK query searchable items - ${ms}ms`);
			return result;
		} catch (err) {
			console.log(err);
		}
	}

	const groups = await router.createCaller(await createContext(event)).groups.list();
	const collections = await router.createCaller(await createContext(event)).collections.list();

	const items = await getItems(user.id);

	return { user, collections, groups, items };
};
