<script lang="ts">
	import {
		DotsHorizontalOutline,
		EyeSlashOutline,
		FileCopyOutline,
		TrashBinOutline,
		WindowOutline
	} from 'flowbite-svelte-icons';
	import { Dropdown, DropdownDivider, DropdownItem, IconBtn, ItemProperty } from '$lib/components';
	import type { CollectionProperty, Item } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';

	export let active: boolean = false;

	export let item: Item;
	export let collectionProperties: CollectionProperty[];

	const dispatch = createEventDispatcher<{
		clickOpenItem: string;
		clickHideItem: string;
		clickDuplicateItem: string;
		clickDeleteItem: string;
	}>();

	const getPropValueById = (pid: string) => {
		const collectionProp = collectionProperties.find((prop) => prop.id === pid);
		const itemProp = item.properties.find((property) => property.id === pid);

		if (!collectionProp || !itemProp) return '';

		if (collectionProp.type !== 'SELECT') return itemProp.value;

		const option = collectionProp.options.find((opt) => opt.id === itemProp.value);

		return option ? option.value : '';
	};

	const defaultPropertyColor = 'GRAY';
	const getPropertyColorById = (pid: string) => {
		//TODO: refactor

		const collectionProp = collectionProperties.find((prop) => prop.id === pid);

		const itemProp = item.properties.find((prop) => prop.id === pid);
		if (!collectionProp || collectionProp.type !== 'SELECT') return defaultPropertyColor;

		if (!itemProp || itemProp.value === '') return defaultPropertyColor;

		const option = collectionProp.options.find((opt) => opt.id === itemProp.value);

		if (!option) return defaultPropertyColor;

		return option.color;
	};
</script>

<div
	class={` ${
		active ? 'rounded-r-md bg-gray-100 border-l-2 border-primary' : ' rounded  bg-gray-100 '
	} flex flex-col items-start  py-1 px-2 space-y-2 group`}
>
	<div class="w-full flex justify-between items-center space-x-2">
		<span class="grow text-lg font-semibold">{item.name}</span>

		<Dropdown>
			<IconBtn slot="button" class="invisible group-hover:visible">
				<DotsHorizontalOutline />
			</IconBtn>

			<svelte:fragment>
				<DropdownItem on:click={() => dispatch('clickHideItem', item.id)}>
					<EyeSlashOutline />
					<span> Hide item </span>
				</DropdownItem>

				<DropdownItem on:click={() => dispatch('clickDuplicateItem', item.id)}>
					<FileCopyOutline />
					<span> Duplicate </span>
				</DropdownItem>
				<DropdownDivider />
				<DropdownItem
					on:click={() => dispatch('clickDeleteItem', item.id)}
					class="dropdown-item-red"
				>
					<TrashBinOutline />
					<span> Delete </span>
				</DropdownItem>
			</svelte:fragment>
		</Dropdown>

		<IconBtn
			on:click={() => dispatch('clickOpenItem', item.id)}
			class="invisible group-hover:visible"
		>
			<WindowOutline class="rotate-90" />
		</IconBtn>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each collectionProperties as property}
			<ItemProperty
				itemId={item.id}
				{property}
				color={getPropertyColorById(property.id)}
				value={getPropValueById(property.id)}
				on:updPropertyValue
			/>
		{/each}
	</div>
</div>
