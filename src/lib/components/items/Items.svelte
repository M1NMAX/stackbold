<script lang="ts">
	import { StretchHorizontal, Table } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { ItemsListView, ItemsTableView } from '$lib/components';
	import type { CollectionProperty, Item as ItemType } from '@prisma/client';
	import { ViewButton, ViewButtonsGroup } from '$lib/components/view';
	import { SearchInput } from '$lib/components/search';
	import { SortDropdown } from '$lib/components/sort';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import { DEFAULT_DEBOUNCE_INTERVAL } from '$lib/constant';
	import debounce from 'debounce';

	export let items: ItemType[];
	export let currActiveItemId: string | undefined = undefined;
	export let collectionProperties: CollectionProperty[];
	export let view: string;
	export let onClickNewItemBtn: () => void;

	const sortOptions: SortOption[] = [
		{ label: 'By name (A-Z)', field: 'name', order: 'asc' },
		{ label: 'By name (Z-A)', field: 'name', order: 'desc' },
		{ label: 'By lastest updated', field: 'updatedAt', order: 'asc' },
		{ label: 'By oldest updated', field: 'updatedAt', order: 'desc' },
		{ label: 'By Recently added ', field: 'createdAt', order: 'asc' },
		{ label: 'By oldest added', field: 'createdAt', order: 'desc' }
	];

	let currentSort: SortOption = sortOptions[0];

	const debounceSearch = debounce((query: string) => {
		sortedItems = sortedItems.filter(({ name }) => {
			return name.toLowerCase().includes(query);
		});
	}, DEFAULT_DEBOUNCE_INTERVAL * 0.5);

	function handleOnInputSearch(e: Event) {
		const value = (e.target as HTMLInputElement).value;

		if (value.length > 2) debounceSearch(value);
		else sortedItems = items.sort(sortFun(currentSort.field, currentSort.order));
	}

	$: sortedItems = items.sort(sortFun(currentSort.field, currentSort.order));
</script>

{#if items.length > 0}
	<div class="grow space-y-2">
		<!-- View handler -->
		<div class="flex justify-between space-x-2">
			<div class="w-1/3 flex justify-between items-center space-x-">
				<SearchInput placeholder="Find Item" on:input={handleOnInputSearch} />
			</div>

			<div class="flex justify-between items-center space-x-2">
				<Button size="sm" on:click={onClickNewItemBtn} class="rounded font-semibold">
					New item
				</Button>

				<SortDropdown {sortOptions} bind:currentSort />

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
				bind:order={currentSort.order}
				on:clickTableHead={(e) =>
					(currentSort = {
						...currentSort,
						field: e.detail.field,
						order: currentSort.order === 'asc' ? 'desc' : 'asc'
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
{/if}
