import { type Property, Color, PrismaClient, PropertyType } from '@prisma/client';

const prisma = new PrismaClient();

const colorsNames = ['RED', 'BLUE', 'GREEN'];

const groupsNames = ['Work', 'Personal'];
const collectionsData = [
	{
		name: 'Books',
		properties: [
			{
				name: 'rating',
				type: 'SELECT' as PropertyType,
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
				type: 'SELECT' as PropertyType,
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
				type: 'CHECKBOX' as PropertyType,
				options: [{ value: 'true' }, { value: 'false' }]
			},
			{
				name: 'Conclusion date',
				type: 'DATE' as PropertyType,
				options: [{ value: '2023-12-24' }, { value: '2023-11-19' }, { value: '2023-10-30' }]
			},
			{
				name: 'Notes',
				type: 'TEXT' as PropertyType,
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
				type: 'SELECT' as PropertyType,
				options: [{ value: 'Plan to watch' }, { value: 'Watching' }, { value: 'Watched' }]
			},
			{
				name: 'Score',
				type: 'SELECT' as PropertyType,
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
				type: 'SELECT' as PropertyType,
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
				type: 'DATE' as PropertyType,
				options: [{ value: '2024-01-24' }, { value: '2023-11-24' }, { value: '2023-12-12' }]
			},
			{
				name: 'Notes',
				type: 'TEXT' as PropertyType,
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

const templatesData = [
	{
		name: 'Events',
		description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
		properties: [
			{
				name: 'Date',
				type: 'DATE' as PropertyType,
				options: []
			},
			{
				name: 'Notes',
				type: 'TEXT' as PropertyType,
				options: []
			}
		],
		items: [
			{
				name: 'Apple WWDC',
				properties: [{ value: '2022-06-24' }, { value: '06:00 PM' }]
			},
			{
				name: 'S birthdate',
				properties: [{ value: '2022-08-25' }, { value: 'I need to buy a chocolate cake' }]
			}
		]
	},
	{
		name: 'Tasks',

		description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
		properties: [
			{
				name: 'Done',
				type: 'CHECKBOX' as PropertyType,
				options: []
			},
			{
				name: 'Conclusion date',
				type: 'DATE' as PropertyType,
				options: []
			},
			{
				name: 'Notes',
				type: 'DATE' as PropertyType,
				options: []
			}
		],
		items: [
			{
				name: 'Organize the agenda',
				properties: [{ value: 'true' }, { value: '2022-06-24' }, { value: 'Start from september' }]
			},
			{
				name: 'Change battery of smoke detecter',
				properties: [{ value: '' }, { value: '2022-08-25' }, { value: 'I John for help' }]
			}
		]
	},
	{
		name: 'Links',
		description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
		properties: [
			{
				name: 'url',
				type: 'URL' as PropertyType,
				options: []
			}
		],
		items: [
			{
				name: 'Shadcn-svelte-ui',
				properties: [{ value: 'https://www.shadcn-svelte.com/docs' }]
			},
			{
				name: 'Headless ui',
				properties: [{ value: 'https://headlessui.dev' }]
			}
		]
	},

	{
		name: 'Movies',
		icon: { name: 'FilmIcon' },
		description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
		properties: [
			{
				name: 'Status',
				type: 'SELECT' as PropertyType,
				options: [{ value: 'Plan to watch' }, { value: 'Watching' }, { value: 'Watched' }]
			},
			{
				name: 'Score',
				type: 'SELECT' as PropertyType,
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
				type: 'SELECT' as PropertyType,
				options: [{ value: 'Netflix' }, { value: 'Vizer.tv' }, { value: 'Stremio' }]
			}
		],
		items: [
			{
				name: 'Taken',
				properties: [
					{
						value: 'Plan to watch'
					},
					{ value: '' },
					{ value: 'Vizer.tv' }
				]
			},
			{
				name: 'The accountant',
				properties: [{ value: 'Watched' }, { value: '7-Good' }, { value: 'Stremio' }]
			}
		]
	}
];

const randomIntFromInterval = (min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1) + min);

const assignPropertyValue = (property: Property) => {
	const rand = randomIntFromInterval(0, property.options.length - 1);
	if (property.type === 'SELECT') return property.options[rand].id;

	return property.options.length !== 0 ? property.options[rand].value : '';
};

const mockDescrp =
	"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

async function main() {
	const user = await prisma.user.findFirst({ where: { email: 'john@email.com' } });
	if (!user) throw new Error('There are no users');

	// clean the DB
	await prisma.group.deleteMany();
	await prisma.collection.deleteMany();
	await prisma.item.deleteMany();
	await prisma.template.deleteMany();

	let groupsIds: string[] = [];

	for (const name of groupsNames) {
		const { id } = await prisma.group.create({
			data: { name, ownerId: user.id }
		});

		groupsIds.push(id);
	}

	for (const collection of collectionsData) {
		const { name, properties } = collection;
		const createdCollection = await prisma.collection.create({
			data: {
				ownerId: user.id,
				name,
				description: Math.random() < 0.5 ? mockDescrp : '',
				properties: properties.map(({ name, type, options }) => ({
					name,
					type,
					options: options.map(({ value }) => ({
						value,
						color: colorsNames[randomIntFromInterval(0, 2)] as Color
					}))
				})),
				isFavourite: Math.random() < 0.5,
				groupId: Math.random() > 0.7 ? undefined : groupsIds[randomIntFromInterval(0, 1)]
			}
		});

		console.log(`Created collection with id: ${createdCollection.id}`);
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

	for (const template of templatesData) {
		const { name, description, properties, items } = template;
		const createdTemplate = await prisma.template.create({
			data: {
				name,
				description,
				properties: properties.map(({ name, type, options }) => ({
					name,
					type,
					options: options.map(({ value }) => ({
						value,
						color: colorsNames[randomIntFromInterval(0, 2)] as Color
					}))
				}))
			}
		});

		console.log(`Created template with id: ${createdTemplate.id}`);
		await prisma.template.update({
			where: { id: createdTemplate.id },
			data: {
				items: {
					push: items.map(({ name, properties }) => ({
						name,
						properties: createdTemplate.properties.map((templateProp, idx) => ({
							id: templateProp.id,
							value:
								templateProp.type !== 'SELECT'
									? properties[idx].value
									: templateProp.options[randomIntFromInterval(0, templateProp.options.length - 1)]
											.id
						}))
					}))
				}
			}
		});
		console.log(`Added items to template with id: ${createdTemplate.id}`);
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
