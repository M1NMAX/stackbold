import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	await prisma.collection.deleteMany();

	await prisma.collection.create({
		data: {
			name: 'Collection one',
			content: 'Collection one content'
		}
	});

	await prisma.collection.create({
		data: {
			name: 'Collection tgow'
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
