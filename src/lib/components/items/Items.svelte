<script lang="ts">
	import { List, Search, Table } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import sortFun, { type IBaseSchema, type OrderType } from '$lib/utils/sort';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { ItemsListView, ItemsTableView } from '$lib/components';
	import type { CollectionProperty, Item as ItemType } from '@prisma/client';
	import * as RadioGroup from '$lib/components/ui/radio-group';

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
		<div class="flex justify-between items-center space-x-0.5">
			<RadioGroup.Root bind:value={view} class="h-9 flex px-0.5 rounded-sm bg-secondary">
				<div class="flex items-center space-x-2">
					<Label
						for="list"
						class={`${
							view === 'list' ? 'bg-card' : 'bg-secondary'
						} py-0.5 px-1.5 rounded-sm text-secondary-foreground`}
					>
						<RadioGroup.Item value="list" id="list" class="sr-only" />

						<div class="flex items-center justify-between space-x-2 text-base">
							<List class="icon-xs" />
							<span> List </span>
						</div>
					</Label>
				</div>

				<div class="flex items-center space-x-2">
					<Label
						for="table"
						class={`${
							view === 'table' ? 'bg-card' : 'bg-secondary hover:bg-card/90'
						} py-0.5 px-1 rounded-sm`}
					>
						<RadioGroup.Item value="table" id="table" class="sr-only" />

						<div class="flex items-center justify-between space-x-2 text-base">
							<Table class="icon-xs" />
							<span> Table </span>
						</div>
					</Label>
				</div>
			</RadioGroup.Root>

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
		</div>
		<div class="flex justify-between items-center space-x-2">
			<div class="relative">
				<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
					<Search class="text-primary w-5 h-5" />
				</div>
				<input
					class="w-full h-9 pl-10 text-base font-semibold rounded bg-secondary placeholder:text-primary focus:outline-none focus:placeholder:text-gray-800"
					placeholder="Find Item"
				/>
			</div>
			<Button size="sm" on:click={onClickNewItemBtn}>New item</Button>
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
