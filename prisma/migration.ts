import { GroupByConfig, PrismaClient, View, } from '@prisma/client';

const prisma = new PrismaClient();
async function migrate() {
    const collections = await prisma.collection.findMany()

    for (const collection of collections) {

        const groupByConfigs: GroupByConfig[] = []
        if (collection.groupItemsBy) {
            groupByConfigs.push({ view: View.LIST, propertyId: collection.groupItemsBy })
            groupByConfigs.push({ view: View.TABLE, propertyId: collection.groupItemsBy })
        }

        await prisma.collection.update({
            where: { id: collection.id },
            data: { groupByConfigs }
        })


        console.log(" Updated Collection  with Id", collection.id)
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