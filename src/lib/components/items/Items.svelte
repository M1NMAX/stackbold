<script lang="ts">
	import { ItemsListView, ItemsTableView, RadioButton } from '$lib/components';
	import sortFun, { type IBaseSchema, type OrderType } from '$lib/utils/sort';
	import {
		ArrowSortLettersOutline,
		ClockOutline,
		ListOutline,
		SearchOutline,
		TableRowOutline,
		IconOutline
	} from 'flowbite-svelte-icons';
	import type { CollectionProperty, Item as ItemType } from '@prisma/client';
	import Dropdown from '../Dropdown/Dropdown.svelte';
	import DropdownItem from '../Dropdown/DropdownItem.svelte';
	import type { ComponentType } from 'svelte';

	export let items: ItemType[];
	export let currActiveItemId: string | undefined = undefined;
	export let collectionProperties: CollectionProperty[];
	export let view: string;

	let sortDetail: { field: keyof IBaseSchema; order: OrderType } = { field: 'name', order: 'asc' };

	$: sortedItems = items.sort(sortFun(sortDetail.field, sortDetail.order));

	type SortOption = {
		label: string;
		field: keyof IBaseSchema;
		order: OrderType;
		icon: ComponentType;
	};

	const sortOptions: SortOption[] = [
		{ label: 'By name (A-Z)', field: 'name', order: 'asc', icon: ArrowSortLettersOutline },
		{ label: 'By name (Z-A)', field: 'name', order: 'desc', icon: ArrowSortLettersOutline },
		{ label: 'By lastest updated', field: 'updatedAt', order: 'asc', icon: ClockOutline },
		{ label: 'By oldest updated', field: 'updatedAt', order: 'desc', icon: ClockOutline }
	];

	$: currSortLabel = sortOptions.find(
		(option) => option.field === sortDetail.field && option.order === sortDetail.order
	)?.label;
</script>

<div class="h-full p-1 space-y-2">
	<!-- View handler -->
	<div class="flex justify-between space-x-2">
		<div class="flex justify-between space-x-2">
			<div class="inline-flex rounded shadow-sm bg-gray-100">
				<RadioButton value="list" bind:group={view}><ListOutline /></RadioButton>
				<RadioButton value="table" bind:group={view}><TableRowOutline /></RadioButton>
			</div>

			<Dropdown alighEnd={false}>
				<button slot="button" class="btn btn-sm">
					Sort {currSortLabel}
				</button>

				<svelte:fragment>
					{#each sortOptions as { label, field, order, icon }}
						<DropdownItem on:click={() => (sortDetail = { field, order })}>
							<IconOutline {icon} />
							{label}
						</DropdownItem>
					{/each}
				</svelte:fragment>
			</Dropdown>
			<button class="btn btn-sm">
				<SearchOutline class="text-gray-500" />
			</button>
		</div>
		<div>
			<button class="btn btn-sm btn-primary"> New item </button>
		</div>
	</div>

	{#if view === 'table'}
		<ItemsTableView
			items={sortedItems}
			{currActiveItemId}
			{collectionProperties}
			bind:order={sortDetail.order}
			on:clickTableHead={(e) =>
				(sortDetail = {
					field: e.detail.field,
					order: sortDetail.order === 'asc' ? 'desc' : 'asc'
				})}
			on:clickOpenItem
			on:clickHideItem
			on:clickDuplicateItem
			on:clickDeleteItem
			on:updPropertyValue
		/>
	{:else}
		<ItemsListView
			items={sortedItems}
			{currActiveItemId}
			{collectionProperties}
			on:clickOpenItem
			on:clickHideItem
			on:clickDuplicateItem
			on:clickDeleteItem
			on:updPropertyValue
		/>
	{/if}
</div>
