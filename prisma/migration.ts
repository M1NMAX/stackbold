import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function migrate() {
	const collections = await prisma.collection.findMany();

	for (const collection of collections) {
		console.log('Collection ', collection.name);
		for (let i = 0; i < collection.properties.length; i++) {
			const property = collection.properties[i];
			console.log('Property ', property.name, ' id ', property.id);

			await prisma.collection.update({
				where: { id: collection.id },
				data: { properties: { updateMany: { where: { id: property.id }, data: { order: i + 1 } } } }
			});
		}
	}
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
