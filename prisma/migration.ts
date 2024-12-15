import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function migrate() {
	const users = await prisma.user.findMany();

	for (const user of users) {
		const groups = await prisma.group.findMany({ where: { owner: { email: user.email } } });
		const collections = await prisma.collection.findMany({
			where: { owner: { email: user.email } }
		});

		console.log('Deleting old use accont');
		await prisma.user.delete({
			where: { email: user.email }
		});

		const { id, ...userData } = user;
		const updatedUser = await prisma.user.create({
			data: {
				...userData
			}
		});

		for (const collection of collections) {
			const updatedCollection = await prisma.collection.update({
				where: { id: collection.id },
				data: {
					ownerId: updatedUser.id
				}
			});

			console.log('Collection', updatedCollection.id, 'updated');
		}

		for (const group of groups) {
			const updatedGroup = await prisma.group.update({
				where: { id: group.id },
				data: {
					ownerId: updatedUser.id
				}
			});
			console.log('Group ', updatedGroup.id, 'updated');
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
