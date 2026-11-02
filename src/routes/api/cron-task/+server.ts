import { json, error } from '@sveltejs/kit';
import { CRON_SECRET } from '$env/static/private';
import type { RequestHandler } from './$types';
import { cleanupOrphanedAttachments } from '$lib/trpc/routes/collections';

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	const expected = `Bearer ${CRON_SECRET}`;

	if (!authHeader || authHeader !== expected) throw error(401, 'Unauthorized');

	try {
		await runScheduledTask();
		return json({ success: true, ranAt: new Date().toISOString() });
	} catch (err) {
		console.error('Cron task failed:', err);
		throw error(500, 'Task execution failed');
	}
};

async function runScheduledTask() {
	await cleanupOrphanedAttachments();
}
