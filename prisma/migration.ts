import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function migrate() {
	// console.log('No migration available ');

	await prisma.collection.updateMany({ data: { accessedAt: new Date() } });
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
