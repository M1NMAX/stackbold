<script lang="ts">
	import { StretchHorizontal, Table } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import sortFun, { type IBaseSchema, type OrderType } from '$lib/utils/sort';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { ItemsListView, ItemsTableView } from '$lib/components';
	import type { CollectionProperty, Item as ItemType } from '@prisma/client';
	import { ViewButton, ViewButtonsGroup } from '$lib/components/view/';
	import { SearchInput } from '$lib/components/search';

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

<div class="grow space-y-2">
	<!-- View handler -->
	<div class="flex justify-between space-x-2">
		<div class="w-1/3 flex justify-between items-center space-x-0.5">
			<SearchInput placeholder="Find Item" />
		</div>

		<div class="flex justify-between items-center space-x-2">
			<Button size="sm" on:click={onClickNewItemBtn} class="rounded font-semibold">New item</Button>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button builders={[builder]} variant="secondary" size="sm">Sort {currSortLabel}</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-56">
					<DropdownMenu.Label>Sort By</DropdownMenu.Label>
					<DropdownMenu.Separator />

					<DropdownMenu.Group>
						{#each sortOptions as { label, field, order }}
							<DropdownMenu.CheckboxItem
								checked={sortDetail.field === field && sortDetail.order === order}
								on:click={() => (sortDetail = { field, order })}
							>
								{label}
							</DropdownMenu.CheckboxItem>
						{/each}
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<ViewButtonsGroup bind:value={view}>
				<ViewButton {view} value="list">
					<StretchHorizontal class="icon-md" />
				</ViewButton>
				<ViewButton {view} value="table">
					<Table class="icon-md" />
				</ViewButton>
			</ViewButtonsGroup>
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
			on:clickRenameItem
			on:clickDuplicateItem
			on:clickDeleteItem
			on:updPropertyValue
			on:updPropertyVisibility
		/>
	{:else}
		<ItemsListView
			items={sortedItems}
			{currActiveItemId}
			{collectionProperties}
			on:clickOpenItem
			on:clickRenameItem
			on:clickDuplicateItem
			on:clickDeleteItem
			on:updPropertyValue
		/>
	{/if}
</div>
