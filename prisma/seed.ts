import { type CollectionProperty, Color, PrismaClient, PropertyType } from '@prisma/client';

const prisma = new PrismaClient();

const colorsNames = [Color.RED, Color.BLUE, Color.GREEN];
const collectionsData = [
	{
		name: 'Books',
		properties: [
			{
				name: 'rating',
				type: PropertyType.SELECT,
				options: [
					{ value: '1-Appaling' },
					{ value: '2-Horrible' },
					{ value: '3-Very Bad' },
					{ value: '4-Bad' },
					{ value: '5-Average' },
					{ value: '6-Fine' },
					{ value: '7-Good' },
					{ value: '8-Very Good' },
					{ value: '9-Great' },
					{ value: '10-Masterpiece' }
				]
			},
			{
				name: 'status',
				type: PropertyType.SELECT,
				options: [
					{ value: 'Reading' },
					{ value: 'Plan to read' },
					{ value: 'Completed' },
					{ value: 'On Hold' },
					{ value: 'Re-reading' },
					{ value: 'Dropped' }
				]
			}
		],
		items: [
			{ name: 'A Game of Thrones' },
			{ name: 'The Fellowship of the Ring' },
			{ name: 'The Wise Man`s Fear' },
			{ name: 'Dracula' }
		]
	},
	{
		name: 'Tasks',
		properties: [
			{
				name: 'Done',
				type: PropertyType.CHECKBOX,
				options: [{ value: 'true' }, { value: 'false' }]
			},
			{
				name: 'Conclusion date',
				type: PropertyType.DATE,
				options: [{ value: '2023-12-24' }, { value: '2023-11-19' }, { value: '2023-10-30' }]
			},
			{
				name: 'Notes',
				type: PropertyType.TEXT,
				options: [
					{ value: 'I John for help' },
					{ value: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.' }
				]
			}
		],
		items: [
			{ name: 'Change battery of smoke detecter' },
			{ name: 'create a new agenda' },
			{ name: 'Buy more pie' },
			{ name: 'Clean the fidge' }
		]
	},
	{
		name: 'Movies',
		properties: [
			{
				name: 'Status',
				type: PropertyType.SELECT,
				options: [{ value: 'Plan to watch' }, { value: 'Watching' }, { value: 'Watched' }]
			},
			{
				name: 'Score',
				type: PropertyType.SELECT,
				options: [
					{ value: '1-Appaling' },
					{ value: '2-Horrible' },
					{ value: '3-Very Bad' },
					{ value: '4-Bad' },
					{ value: '5-Average' },
					{ value: '6-Fine' },
					{ value: '7-Good' },
					{ value: '8-Very Good' },
					{ value: '9-Great' },
					{ value: '10-Masterpiece' }
				]
			},
			{
				name: 'Plataform',
				type: PropertyType.SELECT,
				options: [{ value: 'Netflix' }, { value: 'Vizer.tv' }, { value: 'Stremio' }]
			}
		],
		items: [
			{ name: 'Taken' },
			{ name: 'The accountant' },
			{ name: 'Free guy' },
			{ name: 'Tomorrow war' },
			{ name: 'The Turman show' },
			{ name: 'The creator' },
			{ name: 'Now you see me' }
		]
	},
	{
		name: 'Events',
		properties: [
			{
				name: 'Date',
				type: PropertyType.DATE,
				options: [{ value: '2024-01-24' }, { value: '2023-11-24' }, { value: '2023-12-12' }]
			},
			{
				name: 'Notes',
				type: PropertyType.TEXT,
				options: []
			}
		],
		items: [
			{ name: 'Apple WWDC' },
			{ name: 'Susan birthdate' },
			{ name: 'Sunset' },
			{ name: 'Polo birthdate' }
		]
	}
];

const randomIntFromInterval = (min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1) + min);

const assignPropertyValue = (property: CollectionProperty) => {
	const rand = randomIntFromInterval(0, property.options.length - 1);
	if (property.type === 'SELECT') return property.options[rand].id;

	return property.options.length !== 0 ? property.options[rand].value : '';
};

const mockDescrp =
	"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

async function main() {
	const user = await prisma.user.findFirst({ where: { email: 'john@email.com' } });
	if (!user) throw new Error('There are no users');

	await prisma.collection.deleteMany();
	await prisma.item.deleteMany();

	for (const collection of collectionsData) {
		const createdCollection = await prisma.collection.create({
			data: {
				ownerId: user.id,
				name: collection.name,
				description: Math.random() < 0.5 ? mockDescrp : '',
				properties: collection.properties.map((prop) => ({
					name: prop.name,
					type: prop.type,
					options: prop.options.map(({ value }) => ({
						value,
						color: colorsNames[randomIntFromInterval(0, 2)]
					}))
				})),
				isFavourite: Math.random() < 0.5
			}
		});

		console.log(`Created coolection with id: ${createdCollection.id}`);
		for (const item of collection.items) {
			const createdItem = await prisma.item.create({
				data: {
					name: item.name,
					collectionId: createdCollection.id,
					properties: createdCollection.properties.map((property) => ({
						id: property.id,
						value: assignPropertyValue(property)
					}))
				}
			});
			console.log(`Added item with id: ${createdItem.id} to collection: ${createdCollection.id}`);
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
