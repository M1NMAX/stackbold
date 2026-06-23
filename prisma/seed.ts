import {
	Aggregator,
	Color,
	PrismaClient,
	PropertyType,
	TemplateCategory,
	ViewType,
	type PropertyOption
} from '@prisma/client';

const prisma = new PrismaClient();

const colorsNames = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE'];

const templatesData = [
	{
		name: 'Events',
		icon: 'calendar',
		description: 'Track dates, locations, and notes for birthdays, weddings, and get-togethers.',
		templateCategory: TemplateCategory.PERSONAL_LIFE,
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
		name: 'Task Tracker',
		icon: 'workflow',
		description: 'Prioritize tasks, set deadlines, and move them from Todo through Done.',
		templateCategory: TemplateCategory.PRODUCTIVITY,
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
		name: 'Simple Checklist',
		icon: 'todo',
		description: 'Check off simple to-dos and jot a quick note for each one.',
		templateCategory: TemplateCategory.PRODUCTIVITY,
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
		description: 'Track movies to watch, sort by genre, and rate them once watched.',
		templateCategory: TemplateCategory.HOBBIES_ENTERTAINMENT,
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
	},
	{
		name: 'Expense Tracker',
		icon: 'wallet',
		description: 'Log expenses by category, month, and tags to monitor spending.',
		templateCategory: TemplateCategory.FINANCE_SHOPPING,
		properties: [
			{
				name: 'Financial Year',
				type: 'SELECT' as PropertyType,
				options: [{ value: '01.01.2024-31.12.2024' }, { value: '01.01.2025-31.12.2025' }]
			},
			{
				name: 'Amount',
				type: 'NUMBER' as PropertyType,
				options: [],
				aggregator: 'SUM' as Aggregator
			},
			{
				name: 'Month',
				type: 'SELECT' as PropertyType,
				options: [
					{ value: 'Jan' },
					{ value: 'Feb' },
					{ value: 'Mar' },
					{ value: 'Apr' },
					{ value: 'May' },
					{ value: 'Jun' },
					{ value: 'Jul' },
					{ value: 'Aug' },
					{ value: 'Sep' },
					{ value: 'Oct' },
					{ value: 'Nov' },
					{ value: 'Dec' }
				]
			},
			{
				name: 'Category',
				type: 'SELECT' as PropertyType,
				options: [
					{ value: 'Bills' },
					{ value: 'Utilities' },
					{ value: 'Education' },
					{ value: 'Entertainments' },
					{ value: 'Food' },
					{ value: 'Transport' },
					{ value: 'Health' },
					{ value: 'Shopping' }
				]
			},
			{
				name: 'Tags',
				type: 'SELECT' as PropertyType,
				options: [{ value: 'Recurring Expense' }, { value: 'One Time Expense' }]
			}
		],
		items: [
			{
				name: 'Netflix',
				properties: [
					{ value: '01.01.2024-31.12.2024' },
					{ value: '11.99' },
					{ value: 'Mar' },
					{ value: 'Entertainments' },
					{ value: 'Recurring Expense' }
				]
			},
			{
				name: 'Spotify',
				properties: [
					{ value: '01.01.2024-31.12.2024' },
					{ value: '7.99' },
					{ value: 'Mar' },
					{ value: 'Entertainments' },
					{ value: 'Recurring Expense' }
				]
			},
			{
				name: 'Brilliant',
				properties: [
					{ value: '01.01.2024-31.12.2024' },
					{ value: '40.99' },
					{ value: 'Mar' },
					{ value: 'Education' },
					{ value: 'Recurring Expense' }
				]
			},
			{
				name: 'Navegante',
				properties: [
					{ value: '01.01.2024-31.12.2024' },
					{ value: '40' },
					{ value: 'Mar' },
					{ value: 'Transport' },
					{ value: 'Recurring Expense' }
				]
			}
		]
	},
	{
		name: 'Shopping List',
		icon: 'shopping',
		description: 'List items to buy, grouped by category, and check them off while shopping.',
		templateCategory: TemplateCategory.FINANCE_SHOPPING,
		properties: [
			{
				name: 'Quantity',
				type: 'NUMBER' as PropertyType,
				options: []
			},
			{
				name: 'Category',
				type: 'SELECT' as PropertyType,
				options: [
					{ value: 'Produce' },
					{ value: 'Dairy' },
					{ value: 'Bakery' },
					{ value: 'Meat & Seafood' },
					{ value: 'Household' },
					{ value: 'Other' }
				]
			},
			{
				name: 'Bought',
				type: 'CHECKBOX' as PropertyType,
				options: []
			}
		],
		items: [
			{
				name: 'Milk',
				properties: [{ value: '2' }, { value: 'Dairy' }, { value: 'false' }]
			},
			{
				name: 'Eggs',
				properties: [{ value: '12' }, { value: 'Dairy' }, { value: 'true' }]
			},
			{
				name: 'Spinach',
				properties: [{ value: '1' }, { value: 'Produce' }, { value: 'false' }]
			},
			{
				name: 'Paper towels',
				properties: [{ value: '3' }, { value: 'Household' }, { value: 'false' }]
			}
		]
	},
	{
		name: 'Packing List',
		icon: 'backpack',
		description: 'Pack for any trip with categorized items and a packed checkbox.',
		templateCategory: TemplateCategory.FINANCE_SHOPPING,
		properties: [
			{
				name: 'Category',
				type: 'SELECT' as PropertyType,
				options: [
					{ value: 'Clothing' },
					{ value: 'Toiletries' },
					{ value: 'Electronics' },
					{ value: 'Documents' }
				]
			},
			{
				name: 'Quantity',
				type: 'NUMBER' as PropertyType,
				options: []
			},
			{
				name: 'Packed',
				type: 'CHECKBOX' as PropertyType,
				options: []
			}
		],
		items: [
			{
				name: 'Passport',
				properties: [{ value: 'Documents' }, { value: '1' }, { value: 'true' }]
			},
			{
				name: 'Phone charger',
				properties: [{ value: 'Electronics' }, { value: '1' }, { value: 'true' }]
			},
			{
				name: 'T-shirts',
				properties: [{ value: 'Clothing' }, { value: '5' }, { value: 'false' }]
			},
			{
				name: 'Toothbrush',
				properties: [{ value: 'Toiletries' }, { value: '1' }, { value: 'false' }]
			}
		]
	},
	{
		name: 'Habit Log',
		icon: 'repeat',
		description: 'Log each time you complete a habit and see your consistency build over time.',
		templateCategory: TemplateCategory.PRODUCTIVITY,
		properties: [
			{
				name: 'Date',
				type: 'DATE' as PropertyType,
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
				name: 'Meditate 10 minutes',
				properties: [{ value: '2024-06-17' }, { value: '' }]
			},
			{
				name: 'Meditate 10 minutes',
				properties: [{ value: '2024-06-18' }, { value: 'Felt calmer than usual' }]
			},
			{
				name: 'Meditate 10 minutes',
				properties: [{ value: '2024-06-19' }, { value: '' }]
			},
			{
				name: 'Drink 8 glasses of water',
				properties: [{ value: '2024-06-18' }, { value: '' }]
			},
			{
				name: 'Read 10 pages',
				properties: [{ value: '2024-06-17' }, { value: 'Started Atomic Habits' }]
			},
			{
				name: 'Go to the gym',
				properties: [{ value: '2024-06-16' }, { value: '' }]
			}
		]
	},
	{
		name: 'Reading List',
		icon: 'book',
		description: 'Track books you want to read, are reading, or have finished, with ratings.',
		templateCategory: TemplateCategory.HOBBIES_ENTERTAINMENT,
		properties: [
			{
				name: 'Author',
				type: 'TEXT' as PropertyType,
				options: []
			},
			{
				name: 'Status',
				type: 'SELECT' as PropertyType,
				options: [{ value: 'Want to Read' }, { value: 'Reading' }, { value: 'Finished' }]
			},
			{
				name: 'Rating',
				type: 'SELECT' as PropertyType,
				options: [
					{ value: '1-Poor' },
					{ value: '2-Fair' },
					{ value: '3-Good' },
					{ value: '4-Very Good' },
					{ value: '5-Excellent' }
				]
			}
		],
		items: [
			{
				name: 'Atomic Habits',
				properties: [{ value: 'James Clear' }, { value: 'Finished' }, { value: '5-Excellent' }]
			},
			{
				name: 'Project Hail Mary',
				properties: [{ value: 'Andy Weir' }, { value: 'Reading' }, { value: '' }]
			},
			{
				name: 'The Midnight Library',
				properties: [{ value: 'Matt Haig' }, { value: 'Want to Read' }, { value: '' }]
			},
			{
				name: 'Educated',
				properties: [{ value: 'Tara Westover' }, { value: 'Finished' }, { value: '4-Very Good' }]
			}
		]
	},
	{
		name: 'Wishlist',
		icon: 'gift',
		description: "Save gift ideas with price, link, and priority so nothing's forgotten.",
		templateCategory: TemplateCategory.PERSONAL_LIFE,
		properties: [
			{
				name: 'Price',
				type: 'NUMBER' as PropertyType,
				options: []
			},
			{
				name: 'Link',
				type: 'TEXT' as PropertyType,
				options: []
			},
			{
				name: 'Priority',
				type: 'SELECT' as PropertyType,
				options: [{ value: 'Low' }, { value: 'Medium' }, { value: 'High' }]
			},
			{
				name: 'Purchased',
				type: 'CHECKBOX' as PropertyType,
				options: []
			}
		],
		items: [
			{
				name: 'Noise-canceling headphones',
				properties: [
					{ value: '299' },
					{ value: 'https://example.com/headphones' },
					{ value: 'High' },
					{ value: 'false' }
				]
			},
			{
				name: 'Espresso machine',
				properties: [{ value: '450' }, { value: '' }, { value: 'Medium' }, { value: 'false' }]
			},
			{
				name: 'Kindle Paperwhite',
				properties: [{ value: '140' }, { value: '' }, { value: 'Low' }, { value: 'true' }]
			}
		]
	},
	{
		name: 'Bucket List',
		icon: 'flag',
		description: 'Set goals or bucket-list dreams and track them through to done.',
		templateCategory: TemplateCategory.PRODUCTIVITY,
		properties: [
			{
				name: 'Category',
				type: 'SELECT' as PropertyType,
				options: [
					{ value: 'Personal' },
					{ value: 'Career' },
					{ value: 'Travel' },
					{ value: 'Health' },
					{ value: 'Financial' }
				]
			},
			{
				name: 'Target Date',
				type: 'DATE' as PropertyType,
				options: []
			},
			{
				name: 'Status',
				type: 'SELECT' as PropertyType,
				options: [{ value: 'Not Started' }, { value: 'In Progress' }, { value: 'Achieved' }]
			},
			{
				name: 'Progress',
				type: 'NUMBER' as PropertyType,
				options: []
			}
		],
		items: [
			{
				name: 'Run a marathon',
				properties: [
					{ value: 'Health' },
					{ value: '2026-10-12' },
					{ value: 'In Progress' },
					{ value: '60' }
				]
			},
			{
				name: 'Visit Japan',
				properties: [
					{ value: 'Travel' },
					{ value: '2027-03-01' },
					{ value: 'Not Started' },
					{ value: '0' }
				]
			},
			{
				name: 'Get promoted to senior',
				properties: [
					{ value: 'Career' },
					{ value: '2026-12-31' },
					{ value: 'In Progress' },
					{ value: '40' }
				]
			},
			{
				name: 'Save $10,000 emergency fund',
				properties: [
					{ value: 'Financial' },
					{ value: '2026-09-30' },
					{ value: 'In Progress' },
					{ value: '75' }
				]
			}
		]
	},
	{
		name: 'Bookmark',
		icon: 'link',
		description: 'Save links with tags so you can find them again later.',
		templateCategory: TemplateCategory.HOBBIES_ENTERTAINMENT,
		properties: [
			{
				name: 'URL',
				type: 'TEXT' as PropertyType,
				options: []
			},
			{
				name: 'Tags',
				type: 'SELECT' as PropertyType,
				options: [
					{ value: 'Article' },
					{ value: 'Tool' },
					{ value: 'Inspiration' },
					{ value: 'Reference' },
					{ value: 'Video' }
				]
			},
			{
				name: 'Date Added',
				type: 'DATE' as PropertyType,
				options: []
			}
		],
		items: [
			{
				name: 'How to Build a Design System',
				properties: [
					{ value: 'https://example.com/design-system' },
					{ value: 'Article' },
					{ value: '2024-05-01' }
				]
			},
			{
				name: 'Figma',
				properties: [{ value: 'https://figma.com' }, { value: 'Tool' }, { value: '2024-02-15' }]
			},
			{
				name: 'Dribbble Shot - Dashboard UI',
				properties: [
					{ value: 'https://dribbble.com/shots/example' },
					{ value: 'Inspiration' },
					{ value: '2024-06-10' }
				]
			},
			{
				name: 'MDN Web Docs - Flexbox',
				properties: [
					{ value: 'https://developer.mozilla.org/flexbox' },
					{ value: 'Reference' },
					{ value: '2024-01-20' }
				]
			}
		]
	}
];

function randomIntFromInterval(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function findOptionByName(name: string, options: PropertyOption[]) {
	return options.find((opt) => opt.value === name);
}

export function capitalizeFirstLetter(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function getColor() {
	return colorsNames[randomIntFromInterval(0, colorsNames.length - 1)] as Color;
}

async function main() {
	// await prisma.group.deleteMany();
	// await prisma.collection.deleteMany();
	await prisma.collection.deleteMany({ where: { isTemplate: true } });

	for (const template of templatesData) {
		const { properties, items, ...rest } = template;

		const propertiesData = properties.map((property, idx) => ({
			...property,
			order: idx + 1,
			options: {
				create: [
					...property.options.map(({ value }) => ({
						value,
						color: getColor()
					}))
				]
			}
		}));

		const collection = await prisma.collection.create({
			data: {
				...rest,
				isTemplate: true,
				properties: {
					create: [...propertiesData]
				}
			},
			include: {
				properties: {
					include: { options: { orderBy: { order: 'asc' } } },
					orderBy: { order: 'asc' }
				}
			}
		});

		console.log(`Created template collection with id: ${collection.id}`);

		const viewData = Object.keys(ViewType).map((v, idx) => ({
			shortId: idx + 1,
			order: idx + 1,
			name: capitalizeFirstLetter(v),
			type: v as ViewType,
			collectionId: collection.id,
			filters: [],
			sorts: [],
			properties: [
				...collection.properties.map((property) => ({
					isVisible: true,
					id: property.id
				}))
			]
		}));

		const itemData = items.map((item) => ({
			...item,
			collectionId: collection.id,
			properties: collection.properties.map((property, idx) => ({
				id: property.id,
				value:
					property.type !== PropertyType.SELECT
						? item.properties[idx].value
						: findOptionByName(item.properties[idx].value, property.options)?.id || ''
			}))
		}));

		await Promise.all([
			prisma.item.createMany({ data: itemData }),
			prisma.view.createMany({ data: viewData })
		]);

		console.log(`Added views and items to template collection with id: ${collection.id}`);
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
