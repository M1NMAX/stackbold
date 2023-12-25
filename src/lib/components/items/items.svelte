<script lang="ts">
	import { StretchHorizontal, Table } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import type { Property, Item } from '@prisma/client';
	import { ViewButton, ViewButtonsGroup } from '$lib/components/view';
	import { SearchInput } from '$lib/components/search';
	import { SortDropdown, setSortState, sortOptions } from '$lib/components/sort';
	import { sortFun } from '$lib/utils/sort';
	import debounce from 'debounce';
	import { ItemsListView, ItemsTableView } from '.';

	export let items: Item[];
	export let properties: Property[];
	export let view: string;
	export let onClickNewItemBtn: () => void;

	const sort = setSortState(sortOptions[0]);

	const DEBOUNCE_INTERVAL = 500;
	const debounceSearch = debounce((query: string) => {
		sortedItems = sortedItems.filter(({ name }) => {
			return name.toLowerCase().includes(query);
		});
	}, DEBOUNCE_INTERVAL);

	function handleOnInputSearch(e: Event) {
		const value = (e.target as HTMLInputElement).value;

		if (value.length > 2) debounceSearch(value);
		else sortedItems = items.sort(sortFun($sort.field, $sort.order));
	}

	$: sortedItems = items.sort(sortFun($sort.field, $sort.order));
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

				<SortDropdown {sortOptions} bind:currentSort={$sort} />

				<ViewButtonsGroup bind:view>
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
				{properties}
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
				{properties}
				on:clickOpenItem
				on:clickRenameItem
				on:clickDuplicateItem
				on:clickDeleteItem
				on:updPropertyValue
			/>
		{/if}
	</div>
{/if}
