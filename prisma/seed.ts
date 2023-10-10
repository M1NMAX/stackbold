import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const collectionsNames = ['collection one', 'collection two', 'collection three'];
const propertiesName = ['POne', 'PTwo', 'PThree'];
const itemsNames = ['ItemX', 'ItemY', 'ItemZ'];

async function main() {
	const user = await prisma.user.findFirst({ where: { email: 'john@email.com' } });
	if (!user) throw new Error('There are no users');

	await prisma.collection.deleteMany();
	await prisma.item.deleteMany();

	for (const name of collectionsNames) {
		const createdCollection = await prisma.collection.create({
			data: {
				ownerId: user.id,
				name,
				properties: propertiesName.map((name) => ({ name })),
				isFavourite: Math.random() < 0.5
			}
		});

		console.log(`Created coolection with id: ${createdCollection.id}`);
		for (const iName of itemsNames) {
			const item = await prisma.item.create({
				data: {
					name: iName,
					collectionId: createdCollection.id,
					properties: createdCollection.properties.map((property) => ({
						id: property.id,
						value: ''
					}))
				}
			});
			console.log(`Collection: ${createdCollection.id} -> added item with id: ${item.id}`);
		}
	}
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
