import { Aggregator, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function migrate() {
	const properties = await prisma.property.updateMany({
		data: { calculate: Aggregator.NONE }
	});

	console.log('Updated');
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
