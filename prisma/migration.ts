import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function migrate() {
	const collections = await prisma.collection.findMany();

	for (const collection of collections) {
		console.log('Collection ', collection.name);
		for (let i = 0; i < collection.properties.length; i++) {
			const property = collection.properties[i];
			console.log('Property ', property.name, ' id ', property.id);

			const { id, ...rest } = property;
			const createdProperty = await prisma.propertyTmp.create({
				data: {
					collectionId: collection.id,
					...rest
				}
			});

			console.log('Created new property ', property.id, 'with new id ', createdProperty.id);

			await prisma.collection.update({
				where: { id: collection.id },
				data: { properties: { deleteMany: { where: { id: property.id } } } }
			});
			console.log('Removed property ', property.id, ' from collection ', collection.id);

			console.log('Updating item property refs');
			const items = await prisma.item.findMany({ where: { collectionId: collection.id } });

			for (const item of items) {
				console.log('Updating item ', item.id);
				const ref = item.properties.find((prop) => prop.id === property.id);
				if (!ref) continue;
				console.log('Replacing ref id ', ref.id);
				await prisma.item.update({
					where: { id: item.id },
					data: { properties: { push: { id: createdProperty.id, value: ref.value } } }
				});

				await prisma.item.update({
					where: { id: item.id },
					data: { properties: { deleteMany: { where: { id: property.id } } } }
				});
			}
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
