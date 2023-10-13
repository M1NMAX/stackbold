<script lang="ts">
	import {
		AdjustmentsHorizontalOutline,
		CloseOutline,
		UserAddOutline,
		WindowOutline
	} from 'flowbite-svelte-icons';
	import { Button, Drawer, Input, Label } from 'flowbite-svelte';
	import ItemProperty from '$lib/components/ItemProperty.svelte';
	import { sineIn } from 'svelte/easing';

	import type { PageData } from './$types';
	import type { Item, ItemProperty as ItemPropertyType } from '@prisma/client';
	import CollectionProperty from '$lib/components/property/CollectionProperty.svelte';

	export let data: PageData;

	const defaultPropColor = 'gray';
	let busy = false;
	let item: Item | null = null;
	let itemName: string | null = null;

	const handleOnClickItem = (itemId: string) => {
		hidden = false;
		busy = true;
		const foundedItem = data.items.find((item) => item.id === itemId);
		item = foundedItem ? foundedItem : null;

		itemName = item && item.name;

		// item = await trpc().items.getItem(itemId)
	};
	const getPropValueById = (pid: string, itemProps: ItemPropertyType[]) => {
		const property = itemProps.find((property) => property.id === pid);
		if (!property) return '';
		return property.value;
	};

	const getOptionColor = (pid: string, value: string) => {
		const property = data.collection.properties.find((prop) => prop.id === pid);
		if (!property) return defaultPropColor;

		const option = property.options.find((opt) => opt.value === value);

		if (!option) return defaultPropColor;
		return option.color.toString().toLowerCase();
	};

	let hidden = false;
	let activateClickOutside = false;
	let backdrop = false;
	let transitionParams = {
		x: 320,
		duration: 200,
		easing: sineIn
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
		<UserAddOutline class="icon-xs" />
	</Button>
	<Button color="alternative" class="p-2 rounded">
		<AdjustmentsHorizontalOutline class="icon-xs" />
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
				<Button
					on:click={() => handleOnClickItem(item.id)}
					color="alternative"
					class="p-1 rounded invisible group-hover:visible"
				>
					<WindowOutline class="icon-xss rotate-90" />
				</Button>
			</div>

			<div class=" space-x-2">
				{#each data.collection.properties as prop}
					<ItemProperty
						name={prop.name}
						color={prop.type === 'SELECT'
							? getOptionColor(prop.id, getPropValueById(prop.id, item.properties))
							: defaultPropColor}
						type={prop.type}
						value={getPropValueById(prop.id, item.properties)}
					/>
				{/each}
			</div>
		</div>
	{/each}
</div>

<Drawer
	{activateClickOutside}
	{backdrop}
	placement="right"
	transitionType="fly"
	{transitionParams}
	bind:hidden
	id="itemDrawer"
>
	<div class="flex justify-between items-center">
		<Button on:click={() => (hidden = true)} color="alternative" class="p-1 rounded">
			<CloseOutline class="icon-xss" />
		</Button>
		<Button color="alternative" class="p-1 rounded ">
			<AdjustmentsHorizontalOutline class="icon-xss" />
		</Button>
	</div>

	<div class="flex flex-col space-y-1 rounded bg-gray-200 p-1 my-4">
		<Label class="grow truncate font-semibold">Name</Label>
		<Input type="text" value={itemName} class="rounded-md" />
	</div>

	<div class="flex flex-col space-y-4">
		{#each data.collection.properties as property}
			<CollectionProperty
				{property}
				value={getPropValueById(property.id, item ? item.properties : [])}
			/>
		{/each}
	</div>
</Drawer>
