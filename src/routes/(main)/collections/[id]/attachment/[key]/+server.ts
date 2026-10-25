import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDownloadAttachmentUrl } from '$lib/trpc/routes/collections';

export const GET: RequestHandler = async (event) => {
	const { session, user } = event.locals;

	if (session === null || user === null) redirect(302, '/signin');
	if (!user.emailVerified) redirect(302, '/verify-email');
	if (user.registered2FA && !session.twoFactorVerified) redirect(302, '/2fa');

	const { id, key } = event.params;
	const { url } = await getDownloadAttachmentUrl(user.id, { collectionId: id, key });
	return redirect(302, url);
};
