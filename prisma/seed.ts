import { Color, PrismaClient, PropertyType } from '@prisma/client';

const prisma = new PrismaClient();

const colorsNames = ['RED', 'BLUE', 'GREEN'];

const templatesData = [
	{
		name: 'Events',
		icon: 'calendar',
		description:
			'Organize and manage events effortlessly with details like dates, locations, guest lists, and agendas.',
		properties: [
			{
				name: 'Date',
				type: 'DATE' as PropertyType,
				options: []
			},
			{
				name: 'Location',
				type: 'TEXT' as PropertyType,
				options: []
			},
			{
				name: 'Note',
				type: 'TEXT' as PropertyType,
				options: []
			}
		],
		items: [
			{
				name: 'Bob birthdate',
				properties: [
					{ value: '2024-06-24' },
					{ value: '1745 T Street Southeast, Washington' },
					{ value: 'The Surprise party starts at 06:00 PM. Remember the gift.' }
				]
			},
			{
				name: 'Alice birthdate',
				properties: [
					{ value: '2024-04-25' },
					{ value: '6007 Applegate Lane, Louisville' },
					{ value: 'I am responsible for buying the cake. Chocolate cake.' }
				]
			},
			{
				name: 'Susam wedding',
				properties: [
					{ value: '2024-07-25' },
					{ value: '560 Penstock Drive, Grass Valley' },
					{ value: 'Finish the decision on what I will wear. Try to match with my plus one.' }
				]
			}
		]
	},
	{
		name: 'Tasks',
		icon: 'taskBook',

		description:
			'Efficiently manage your tasks by utilizing features such as prioritization, setting deadlines, and tracking progress.',
		properties: [
			{
				name: 'Priority',
				type: 'SELECT' as PropertyType,
				options: [{ value: 'Low' }, { value: 'Medium' }, { value: 'High' }]
			},
			{
				name: 'Deadline',
				type: 'DATE' as PropertyType,
				options: []
			},
			{
				name: 'Status',
				type: 'SELECT' as PropertyType,
				options: [
					{ value: 'Todo' },
					{ value: 'In Progress' },
					{ value: 'Done' },
					{ value: 'Canceled' }
				]
			}
		],
		items: [
			{
				name: 'We need to hack the redundant UTF8 transmitter!',
				properties: [{ value: 'Low' }, { value: '2024-04-24' }, { value: 'Todo' }]
			},
			{
				name: 'We need to generate the virtual HEX alarm!',
				properties: [{ value: 'Low' }, { value: '2024-08-25' }, { value: 'In Progress' }]
			},

			{
				name: 'I`ll parse the wireless SSL protocol, that should driver the API panel!',
				properties: [{ value: 'Medium' }, { value: '2024-08-25' }, { value: 'Canceled' }]
			},
			{
				name: 'You can`t generate the capacitor without indexing the wireless HEX pixel!',
				properties: [{ value: 'Low' }, { value: '2024-08-25' }, { value: 'Canceled' }]
			},
			{
				name: 'Use the digital TLS panel, then you can transmit the haptic system!',
				properties: [{ value: 'High' }, { value: '2024-08-25' }, { value: 'Done' }]
			},
			{
				name: 'We need to bypass the neural TCP card!',
				properties: [{ value: 'High' }, { value: '2024-08-25' }, { value: 'Todo' }]
			}
		]
	},
	{
		name: 'ToDo',
		icon: 'todo',
		description:
			'Manage your todos with this straightforward template. Track what is complete and what remains, with an additional node for each.',
		properties: [
			{
				name: 'Done',
				type: 'CHECKBOX' as PropertyType,
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
				name: 'Organize the agenda',
				properties: [{ value: 'true' }, { value: 'Start from april' }]
			},
			{
				name: 'Change battery of smoke detecter',
				properties: [{ value: 'false' }, { value: 'I John for help' }]
			},
			{
				name: 'Invite some friends over for a game night',
				properties: [{ value: 'false' }, { value: '' }]
			},
			{
				name: 'Write a thank you letter to an influential person in my life',
				properties: [{ value: 'true' }, { value: '' }]
			}
		]
	},
	{
		name: 'Movies',
		icon: 'film',
		description:
			'Easily track movies to watch, categorize them by genre, and mark them as watched with additional detail like ratings.',
		properties: [
			{
				name: 'Genre',
				type: 'SELECT' as PropertyType,
				options: [
					{ value: 'Action' },
					{ value: 'Comedy' },
					{ value: 'Drama' },
					{ value: 'Romance' }
				]
			},
			{
				name: 'Status',
				type: 'SELECT' as PropertyType,
				options: [{ value: 'Plan to watch' }, { value: 'Watched' }]
			},
			{
				name: 'Rating',
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
			}
		],
		items: [
			{
				name: 'Taken (2008)',
				properties: [{ value: 'Action' }, { value: 'Plan to watch' }, { value: '' }]
			},
			{
				name: 'The accountant',
				properties: [{ value: 'Action' }, { value: 'Watched' }, { value: '7-Good' }]
			},
			{
				name: 'Titanic',
				properties: [{ value: 'Drama' }, { value: 'Watched' }, { value: '8-Very Good' }]
			},
			{
				name: 'The Princess Bride',
				properties: [{ value: 'Comedy' }, { value: 'Watched' }, { value: '8-Very Good' }]
			},
			{
				name: 'The Ugly Truth',
				properties: [{ value: 'Romance' }, { value: 'Watched' }, { value: '6-Fine' }]
			},
			{
				name: 'Napoleon',
				properties: [{ value: 'Action' }, { value: 'Plan to watch' }, { value: '6-Fine' }]
			},
			{
				name: 'The Truman Show',
				properties: [{ value: 'Comedy' }, { value: 'Watched' }, { value: '8-Very Good' }]
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
		const { icon, name, description, properties, items } = template;
		const createdTemplate = await prisma.template.create({
			data: {
				icon,
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
