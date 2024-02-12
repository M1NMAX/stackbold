import { Color, PrismaClient, PropertyType } from '@prisma/client';

const prisma = new PrismaClient();

const colorsNames = ['RED', 'BLUE', 'GREEN'];

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

async function main() {
	// clean the DB
	await prisma.group.deleteMany();
	await prisma.collection.deleteMany();
	await prisma.item.deleteMany();
	await prisma.template.deleteMany();

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
