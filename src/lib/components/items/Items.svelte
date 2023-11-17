<script lang="ts">
	import { ItemsListView, ItemsTableView, RadioButton } from '$lib/components';
	import sortFun, { type IBaseSchema, type OrderType } from '$lib/utils/sort';
	import { ListOutline, SearchOutline, TableRowOutline } from 'flowbite-svelte-icons';
	import type { CollectionProperty, Item as ItemType } from '@prisma/client';
	import Dropdown from '../Dropdown/Dropdown.svelte';
	import DropdownItem from '../Dropdown/DropdownItem.svelte';

	export let items: ItemType[];
	export let currActiveItemId: string | undefined = undefined;
	export let collectionProperties: CollectionProperty[];
	export let view: string;
	export let onClickNewItemBtn: () => void;

	let sortDetail: { field: keyof IBaseSchema; order: OrderType } = { field: 'name', order: 'asc' };

	$: sortedItems = items.sort(sortFun(sortDetail.field, sortDetail.order));

	type SortOption = {
		label: string;
		field: keyof IBaseSchema;
		order: OrderType;
	};

	const sortOptions: SortOption[] = [
		{ label: 'By name (A-Z)', field: 'name', order: 'asc' },
		{ label: 'By name (Z-A)', field: 'name', order: 'desc' },
		{ label: 'By lastest updated', field: 'updatedAt', order: 'asc' },
		{ label: 'By oldest updated', field: 'updatedAt', order: 'desc' },
		{ label: 'By Recently added ', field: 'createdAt', order: 'asc' },
		{ label: 'By oldest added', field: 'createdAt', order: 'desc' }
	];

	$: currSortLabel = sortOptions.find(
		(option) => option.field === sortDetail.field && option.order === sortDetail.order
	)?.label;
</script>

<div class="h-full p-1 space-y-2">
	<!-- View handler -->
	<div class="flex justify-between space-x-2">
		<div class="flex justify-between items-center space-x-2">
			<div class="inline-flex rounded shadow-sm bg-base-300">
				<RadioButton value="list" bind:group={view}><ListOutline /> List</RadioButton>
				<RadioButton value="table" bind:group={view}><TableRowOutline /> Table</RadioButton>
			</div>

			<Dropdown alighEnd={false}>
				<button slot="button" class="btn btn-sm">
					Sort {currSortLabel}
				</button>

				<svelte:fragment>
					{#each sortOptions as { label, field, order }}
						<DropdownItem
							on:click={() => (sortDetail = { field, order })}
							class={`${currSortLabel === label && 'bg-primary/80 text-white'} `}
						>
							{label}
						</DropdownItem>
					{/each}
				</svelte:fragment>
			</Dropdown>
		</div>
		<div class="flex justify-between items-center space-x-2">
			<div class="relative">
				<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
					<SearchOutline class="text-primary" />
				</div>
				<input
					class="w-full h-9 pl-10 text-base font-semibold rounded bg-base-300 placeholder:text-primary focus:outline-none focus:placeholder:text-gray-800"
					placeholder="Find Item "
				/>
			</div>
			<button on:click={onClickNewItemBtn} class="btn btn-sm btn-primary"> New item </button>
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
