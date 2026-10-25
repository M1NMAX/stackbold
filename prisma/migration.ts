import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function migrate() {
	// console.log('No migration available ');

	// const defaultContent = {
	// 	type: 'doc',
	// 	content: [{ type: 'paragraph' }]
	// };

	// await prisma.collection.updateMany({ data: { content: defaultContent } });
	//
	// await prisma.collection.updateMany({ data: { itemsOnly: true } });
	// await prisma.collection.updateMany({ data: { isTaskModeEnabled: false } });
	await prisma.item.updateMany({ data: { isDone: false } });
}

migrate()
	.then(() => {
		console.log('Migration completed');
	})
	.catch((error) => {
		console.error('Migration failed', error);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
