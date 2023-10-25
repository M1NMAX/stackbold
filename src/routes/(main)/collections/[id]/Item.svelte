<script lang="ts">
	import {
		AdjustmentsHorizontalOutline,
		EyeSlashOutline,
		FileCopyOutline,
		TrashBinOutline,
		WindowOutline
	} from 'flowbite-svelte-icons';
	import { Dropdown, DropdownDivider, DropdownItem, IconBtn, ItemProperty } from '$lib/components';
	import type { Color } from '$lib/types';
	import type { Item, CollectionProperty, PropertyType } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';

	export let active: boolean = false;

	export let item: Item;
	export let collectionProperties: CollectionProperty[];

	const dispatch = createEventDispatcher<{
		clickOpen: undefined;
		clickHide: undefined;
		clickDuplicate: undefined;
		clickDelete: undefined;
	}>();

	const getPropValueById = (pid: string) => {
		const collectionProp = collectionProperties.find((prop) => prop.id === pid);
		const itemProp = item.properties.find((property) => property.id === pid);

		if (!collectionProp || !itemProp) return '';

		if (collectionProp.type !== 'SELECT') return itemProp.value;

		const option = collectionProp.options.find((opt) => opt.id === itemProp.value);

		return option ? option.value : '';
	};

	const defaultPropColor = 'gray';
	const getPropertyColorById = (pid: string) => {
		//TODO: refactor

		const collectionProp = collectionProperties.find((prop) => prop.id === pid);

		if (!collectionProp || collectionProp.type !== 'SELECT') return defaultPropColor;

		const itemProp = item.properties.find((prop) => prop.id === pid);

		if (!itemProp || itemProp.value === '') return defaultPropColor;

		const option = collectionProp.options.find((opt) => opt.id === itemProp.value);

		if (!option) return defaultPropColor;
		return option.color.toLowerCase() as Color;
	};
</script>

<div
	class={` ${
		active ? 'rounded-tl-md bg-gray-100 border-r-4 border-primary-600' : ' rounded  bg-gray-100 '
	} flex flex-col items-start  py-1 px-2 space-y-2 group`}
>
	<div class="w-full flex justify-between items-center space-x-2">
		<span class="grow text-lg font-semibold">{item.name}</span>

		<Dropdown>
			<IconBtn slot="button" class="invisible group-hover:visible">
				<AdjustmentsHorizontalOutline />
			</IconBtn>

			<svelte:fragment>
				<DropdownItem on:click={() => dispatch('clickHide')}>
					<EyeSlashOutline />
					<span> Hide item </span>
				</DropdownItem>

				<DropdownItem on:click={() => dispatch('clickDuplicate')}>
					<FileCopyOutline />
					<span> Duplicate </span>
				</DropdownItem>
				<DropdownDivider />
				<DropdownItem on:click={() => dispatch('clickDelete')} class="dropdown-item-red">
					<TrashBinOutline />
					<span> Delete </span>
				</DropdownItem>
			</svelte:fragment>
		</Dropdown>

		<IconBtn on:click={() => dispatch('clickOpen')} class="invisible group-hover:visible">
			<WindowOutline class="rotate-90" />
		</IconBtn>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each collectionProperties as prop}
			<ItemProperty
				name={prop.name}
				type={prop.type}
				color={getPropertyColorById(prop.id)}
				value={getPropValueById(prop.id)}
			/>
		{/each}
	</div>
</div>
