import { Collection, PrismaClient, Property, ViewType } from '@prisma/client';

const prisma = new PrismaClient();
async function migrate() {
	await prisma.view.deleteMany();
	const collections = await prisma.collection.findMany({ include: { properties: true } });
	for (const collection of collections) {
		await prisma.view.createMany({
			data: [
				{
					collectionId: collection.id,
					name: 'List',
					shortId: 1,
					order: 1,
					type: ViewType.LIST,
					groupBy: getGroupByConfig(ViewType.LIST, collection),
					filters: getFilterConfig(ViewType.LIST, collection),
					properties: getPropertiesVisibility(collection.properties, ViewType.LIST)
				},
				{
					collectionId: collection.id,
					name: 'Table',
					shortId: 2,
					order: 2,
					type: ViewType.TABLE,
					groupBy: getGroupByConfig(ViewType.TABLE, collection),
					filters: getFilterConfig(ViewType.TABLE, collection),
					properties: getPropertiesVisibility(collection.properties, ViewType.LIST)
				}
			]
		});
		console.log(`Collection ${collection.name} views created`);
	}
}

function getGroupByConfig(view: ViewType, collection: Collection) {
	const target = collection.groupByConfigs.find((config) => config.view === view);
	if (!target || !target.propertyId) return undefined;
	return target.propertyId;
}

function getFilterConfig(view: ViewType, collection: Collection) {
	const target = collection.filterConfigs.find((config) => config.view === view);
	if (!target) return [];
	return target.filters;
}

function getPropertiesVisibility(properties: Property[], view: ViewType) {
	return properties.map((property) => ({
		id: property.id,
		isVisible: property.visibleInViews.includes(view)
	}));
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
