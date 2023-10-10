<script lang="ts">
	import {
		AdjustmentsHorizontalOutline,
		ArrowRightArrowLeftOutline,
		CheckCircleSolid,
		DotsVerticalOutline,
		SearchOutline,
		WindowOutline
	} from 'flowbite-svelte-icons';
	import type { PageData } from './$types';
	import { Badge, Button } from 'flowbite-svelte';

	import type { Colors } from 'flowbite-svelte';
	import ItemProperty from '$lib/components/ItemProperty.svelte';

	export let data: PageData;

	const items = [
		{ id: 1, name: 'item 1', note: 'item one description' },
		{ id: 2, name: 'item 2', note: 'item two description' }
	];

	const itemProps = [
		{ id: 1, value: 'movies' },
		{ id: 2, value: 'stremio' },
		{ id: 3, value: '5' }
	];

	const collectionProps = [
		{ id: 1, name: 'type', type: 'select', values: ['series', 'movies'], color: 'red' as Colors },
		{
			id: 2,
			name: 'platform',
			type: 'select',
			values: ['netflix', 'stremio'],
			color: 'blue' as Colors
		},
		{ id: 3, name: 'completed', type: 'check', values: ['true', 'false'], color: 'green' as Colors }
	];

	const collectionPropsV2 = [
		{
			id: 2,
			name: 'platform',
			type: 'select',
			values: ['netflix', 'stremio'],
			color: 'blue' as Colors
		},
		{ id: 3, name: 'completed', type: 'number', values: ['10', '5'], color: 'green' as Colors }
	];

	const getPropValueById = (pid: number) => {
		const property = itemProps.find((property) => property.id === pid);
		if (!property) return '';
		return property.value;
	};
</script>

<svelte:head>
	<title>{data.collection.name}</title>
</svelte:head>

<div class="flex items-center space-x-1.5">
	<h1 class="grow font-semibold text-2xl">
		{data.collection.name}
	</h1>

	<Button color="alternative" class="p-2 rounded">
		<SearchOutline class="icon-xs" />
	</Button>
	<Button color="alternative" class="p-2 rounded">
		<AdjustmentsHorizontalOutline class="icon-xs" />
	</Button>
	<Button color="alternative" class="p-2 rounded">
		<DotsVerticalOutline class="icon-xs" />
	</Button>
</div>

<div>
	{data.collection.description}
</div>
<div class="space-y-4 p-1">
	{#each items as item}
		<div class="border rounded p-1 group">
			<div class="flex justify-between">
				<span class="grow text-lg font-medium">{item.name}</span>
				<Button color="alternative" class="p-1 rounded invisible group-hover:visible">
					<AdjustmentsHorizontalOutline class="icon-xss" />
				</Button>
			</div>

			<div class=" space-x-2">
				{#each collectionProps as prop}
					<Badge color={prop.color} class="items-center text-base font-medium">
						{#if prop.type === 'check'}
							<span class="flex space-x-2">
								<span>
									{prop.name}
								</span>

								{#if getPropValueById(prop.id) === 'true'}
									<CheckCircleSolid class="icon-xss" />
								{:else}
									<div class="w-5 h-5 border border-gray-400 rounded-full bg-white" />
								{/if}
							</span>
						{:else}
							{getPropValueById(prop.id)}
						{/if}
					</Badge>
				{/each}
			</div>
		</div>
	{/each}

	<div>
		Example
		<div class="border rounded p-1 space-y-2 group">
			<div class="flex justify-between space-x-4">
				<span class="grow text-lg font-medium">The creator</span>
				<Button color="alternative" class="p-1 rounded invisible group-hover:visible">
					<AdjustmentsHorizontalOutline class="icon-xss" />
				</Button>
			</div>

			<div class=" space-x-2">
				{#each collectionProps as prop}
					<ItemProperty
						name={prop.name}
						color={prop.color}
						type={prop.type}
						value={getPropValueById(prop.id)}
					/>
				{/each}
			</div>
		</div>

		<div class="flex flex-col items-start border rounded p-1 space-x-2 space-y-2 group">
			<div class="flex justify-between space-x-4">
				<Badge color="pink" class="items-center text-base font-medium">Movie</Badge>
				<span class="grow text-lg font-medium">The creator</span>
				<Button color="alternative" class="p-1 rounded invisible group-hover:visible">
					<AdjustmentsHorizontalOutline class="icon-xss" />
				</Button>
			</div>

			<div class=" space-x-2">
				{#each collectionPropsV2 as prop}
					<ItemProperty
						name={prop.name}
						color={prop.color}
						type={prop.type}
						value={getPropValueById(prop.id)}
					/>
				{/each}
			</div>
		</div>

		<div class="flex flex-col items-start border rounded p-1 space-x-2 space-y-2 group">
			<div class="w-full flex justify-between items-center space-x-2">
				<div class="w-5 h-5 border border-gray-400 rounded-full bg-white" />
				<span class="grow text-lg font-medium">The creator</span>
				<Button color="alternative" class="p-1 rounded invisible group-hover:visible">
					<AdjustmentsHorizontalOutline class="icon-xss" />
				</Button>
			</div>

			<div class=" space-x-2">
				{#each collectionPropsV2 as prop}
					<ItemProperty
						name={prop.name}
						color={prop.color}
						type={prop.type}
						value={getPropValueById(prop.id)}
					/>
				{/each}
			</div>
		</div>

		<div class="flex flex-col items-start border rounded p-1 space-x-2 space-y-2 group">
			<div class="w-full flex justify-between items-center space-x-2">
				<CheckCircleSolid class="icon-xss text-orange-400" />
				<span class="grow text-lg font-medium">The creator</span>
				<Button color="alternative" class="p-1 rounded invisible group-hover:visible">
					<AdjustmentsHorizontalOutline class="icon-xss" />
				</Button>
				<Button color="alternative" class="p-1 rounded invisible group-hover:visible">
					<WindowOutline class="icon-xss rotate-90" />
				</Button>
			</div>

			<div class=" space-x-2">
				{#each collectionPropsV2 as prop}
					<ItemProperty
						name={prop.name}
						color={prop.color}
						type={prop.type}
						value={getPropValueById(prop.id)}
					/>
				{/each}
			</div>
		</div>

		<div class="flex flex-col items-start border rounded p-1 space-x-2 space-y-2 group">
			<div class="w-full flex justify-between items-center space-x-2">
				<CheckCircleSolid class="icon-xss text-orange-400" />
				<span class="grow text-lg font-medium"
					>Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias repellat amet rem
					labore facilis autem beatae rerum qui, dolorem odio dolor, totam nostrum aut quos fugiat
					reiciendis illum iste laudantium.</span
				>
				<Button color="alternative" class="p-1 rounded invisible group-hover:visible">
					<AdjustmentsHorizontalOutline class="icon-xss" />
				</Button>
			</div>

			<div class=" space-x-2">
				{#each collectionPropsV2 as prop}
					<ItemProperty
						name={prop.name}
						color={prop.color}
						type={prop.type}
						value={getPropValueById(prop.id)}
					/>
				{/each}
			</div>
		</div>
	</div>
</div>
