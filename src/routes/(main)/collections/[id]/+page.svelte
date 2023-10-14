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
	import IconBtn from '$lib/components/IconBtn.svelte';

	export let data: PageData;

	const defaultPropColor = 'gray';
	let busy = false;
	let seletedItem: Item | null = null;
	let itemName: string | null = null;

	const handleOnClickItem = (itemId: string) => {
		hidden = false;
		busy = true;
		const foundedItem = data.items.find((item) => item.id === itemId);
		seletedItem = foundedItem ? foundedItem : null;

		itemName = seletedItem && seletedItem.name;

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

	let hidden = true;
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

<div class="grow m-1.5 ml-0 p-1 rounded-md bg-gray-50">
	<div class="flex items-center space-x-1.5 p-1">
		<h1 class="grow font-semibold text-2xl">
			{data.collection.name}
		</h1>
		<IconBtn>
			<UserAddOutline class="icon-xs" />
		</IconBtn>

		<IconBtn>
			<AdjustmentsHorizontalOutline class="icon-xs" />
		</IconBtn>
	</div>

	<div>
		{data.collection.description}
	</div>

	<div class="space-y-2 p-1">
		{#each data.items as item}
			<div
				class={` ${
					seletedItem && seletedItem.id === item.id
						? 'rounded-l-md bg-gray-100 border-r-4 border-primary-600'
						: 'border rounded'
				} flex flex-col items-start  py-1 px-2 space-y-2 group`}
			>
				<div class="w-full flex justify-between items-center space-x-2">
					<span class="grow text-lg font-semibold">{item.name}</span>

					<IconBtn on:click={() => alert(item.name)} extraClass="invisible group-hover:visible">
						<AdjustmentsHorizontalOutline class="icon-xss" />
					</IconBtn>

					<IconBtn
						on:click={() => handleOnClickItem(item.id)}
						extraClass="invisible group-hover:visible"
					>
						<WindowOutline class="icon-xss rotate-90" />
					</IconBtn>
				</div>

				<div class="flex flex-wrap gap-2">
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
</div>
<div class="xl:w-1/4 bg-gray-50 m-1.5 rounded-md" />

<Drawer
	{activateClickOutside}
	{backdrop}
	placement="right"
	transitionType="fly"
	{transitionParams}
	bind:hidden
	id="itemDrawer"
	class="w-full xl:w-1/4 m-1.5 p-1 rounded-md bg-gray-50"
>
	<div class="flex justify-between items-center">
		<IconBtn on:click={() => (hidden = true)} extraClass="p-4">
			<CloseOutline class="icon-xss" />
		</IconBtn>
		<IconBtn>
			<AdjustmentsHorizontalOutline class="icon-xss" />
		</IconBtn>
	</div>

	<div class="flex flex-col space-y-1 rounded bg-gray-200 p-1 my-4">
		<!-- <Label class=" grow truncate font-semibold">Name</Label> -->
		<Input type="text" value={itemName} class=" rounded-sm text-lg border-none bg-gray-200 " />
	</div>

	<div class="flex flex-col space-y-4">
		{#each data.collection.properties as property}
			<CollectionProperty
				{property}
				value={getPropValueById(property.id, seletedItem ? seletedItem.properties : [])}
			/>
		{/each}
	</div>
</Drawer>
