import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	await prisma.collection.deleteMany();

	await prisma.collection.create({
		data: {
			name: 'Collection one',
			description: 'Collection one content',
			ownerId: '217r3d010700r87'
		}
	});

	await prisma.collection.create({
		data: {
			name: 'Collection tgow',
			ownerId: '217r3d010700r87'
		}
	});
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
