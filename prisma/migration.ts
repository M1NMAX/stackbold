import { Aggregator, Color, PrismaClient, PropertyType, View, type Option } from '@prisma/client';

const prisma = new PrismaClient();
async function migrate() {
    const collections = await prisma.collection.findMany()

    for (const collection of collections) {
        console.log("Collection id", collection.id)
        for (const property of collection.properties) {
            const views: View[] = [];
            // if (property.isVisibleOnListView) views.push(View.LIST);
            // if (property.isVisibleOnTableView) views.push(View.TABLE);

            await prisma.collection.update({
                where: { id: collection.id },
                data: { properties: { updateMany: { where: { id: property.id }, data: { visibleInViews: views } } } }
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