import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function migrate() {
	await prisma.propertyOption.deleteMany();

	const properties = await prisma.property.findMany();

	for (const property of properties) {
		if (property.options.length == 0) continue;

		for (let i = 0; i < property.options.length; i++) {
			const createdOpt = await prisma.propertyOption.create({
				data: {
					propertyId: property.id,
					color: property.options[i].color,
					value: property.options[i].value,
					order: i + 1
				}
			});

			await prisma.item.updateMany({
				where: {
					collectionId: property.collectionId,
					AND: {
						properties: {
							some: {
								id: property.id,
								AND: { value: { contains: property.options[i].id } }
							}
						}
					}
				},
				data: {
					properties: {
						updateMany: {
							where: { id: property.id, AND: { value: { contains: property.options[i].id } } },
							data: { value: createdOpt.id }
						}
					}
				}
			});
		}
	}

	const embeddedCount = await prisma.property
		.findMany({ select: { options: true } })
		.then((ps) => ps.reduce((sum, p) => sum + p.options.length, 0));

	const modelCount = await prisma.propertyOption.count();
	console.assert(embeddedCount === modelCount, 'Mismatch!');
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
