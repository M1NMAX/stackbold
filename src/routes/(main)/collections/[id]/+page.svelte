<script lang="ts">
	import {
		AdjustmentsHorizontalOutline,
		DotsVerticalOutline,
		SearchOutline,
		WindowOutline
	} from 'flowbite-svelte-icons';
	import { Button } from 'flowbite-svelte';
	import ItemProperty from '$lib/components/ItemProperty.svelte';

	import type { PageData } from './$types';
	import type { ItemProperty as ItemPropertyType } from '@prisma/client';

	export let data: PageData;

	const getPropValueById = (pid: string, itemProps: ItemPropertyType[]) => {
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
	{#each data.items as item}
		<div class="flex flex-col items-start border rounded p-1 space-x-2 space-y-2 group">
			<div class="w-full flex justify-between items-center space-x-2">
				<div class="w-5 h-5 border border-gray-400 rounded-full bg-white" />
				<span class="grow text-lg font-medium">{item.name}</span>
				<Button color="alternative" class="p-1 rounded invisible group-hover:visible">
					<AdjustmentsHorizontalOutline class="icon-xss" />
				</Button>
				<Button color="alternative" class="p-1 rounded invisible group-hover:visible">
					<WindowOutline class="icon-xss rotate-90" />
				</Button>
			</div>

			<div class=" space-x-2">
				{#each data.collection.properties as prop}
					<ItemProperty
						name={prop.name}
						color="pink"
						type={prop.type}
						value={getPropValueById(prop.id, item.properties)}
					/>
				{/each}
			</div>
		</div>
	{/each}
</div>
