<script lang="ts">
	import type { PageData } from './$types';
	import { Database, LayoutGrid, StretchHorizontal } from 'lucide-svelte';
	import { PageContent } from '$lib/components/page';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import debounce from 'debounce';
	import { SearchInput } from '$lib/components/search';
	import { setSortState, SortDropdown } from '$lib/components/sort';
	import { icons } from '$lib/components/icon';
	import type { Collection } from '@prisma/client';
	import { ViewButton, ViewButtonsGroup } from '$lib/components/view';
	import { capitalizeFirstLetter, cn } from '$lib/utils';
	import { PROPERTY_COLORS } from '$lib/constant';
	import dayjs from '$lib/utils/dayjs';
	import { Button } from '$lib/components/ui/button';
	import { getModalState } from '$lib/components/modal';
	import { CollectionOverview } from '$lib/components/collection';

	export let data: PageData;
	$: ({ collections } = data);

	type Filters = 'all' | 'favourites' | 'archived';
	let filter: Filters = 'all';

	let view = 'grid';

	const crtCollectionModal = getModalState();

	const sortOptions: SortOption<Collection>[] = [
		{ label: 'By name (A-Z)', field: 'name', order: 'asc' },
		{ label: 'By name (Z-A)', field: 'name', order: 'desc' },
		{ label: 'By lastest updated', field: 'updatedAt', order: 'asc' },
		{ label: 'By oldest updated', field: 'updatedAt', order: 'desc' },
		{ label: 'By Recently added ', field: 'createdAt', order: 'asc' },
		{ label: 'By oldest added', field: 'createdAt', order: 'desc' }
	];
	const sort = setSortState(sortOptions[0]);

	// SEARCH
	const DEBOUNCE_INTERVAL = 500;
	const debounceSearch = debounce((query: string) => {
		sortedCollections = sortedCollections.filter(({ name, description }) => {
			return name.toLowerCase().includes(query) || description.toLowerCase().includes(query);
		});
	}, DEBOUNCE_INTERVAL);

	function handleOnInputSearch(e: Event) {
		const value = (e.target as HTMLInputElement).value;

		if (value.length > 2) debounceSearch(value);
		else sortedCollections = collections.sort(sortFun($sort.field, $sort.order));
	}

	function setFilter(newFilter: string) {
		filter = newFilter as Filters;
	}

	function filterCollections() {
		switch (filter) {
			case 'all':
				return collections;
			case 'favourites':
				return collections.filter((collection) => collection.isFavourite);
			case 'archived':
				return collections.filter((collection) => collection.isArchived);
		}
	}

	$: sortedCollections = filterCollections().sort(sortFun($sort.field, $sort.order));
	$: filter, (sortedCollections = filterCollections());
</script>

<svelte:head>
	<title>Collections - Stackbold</title>
</svelte:head>

<div class="grow rounded-md bg-card text-secondary-foreground overflow-hidden">
	<PageContent>
		<div class="flex items-center space-x-2">
			<Database class="icon-lg" />
			<h1 class="font-semibold text-2xl">Collections</h1>
		</div>

		<div class="space-y-2">
			<div class="flex justify-between space-x-2">
				<div class="w-1/3 flex justify-between items-center space-x-2">
					<SearchInput placeholder="Find Collection" on:input={handleOnInputSearch} />
				</div>

				<div class="space-x-1">
					{#each ['all', 'favourites', 'archived'] as item}
						<Button
							variant={filter === item ? 'secondary' : 'ghost'}
							size="sm"
							class="rounded font-semibold"
							on:click={() => setFilter(item)}>{capitalizeFirstLetter(item)}</Button
						>
					{/each}
				</div>
				<div class="flex justify-between items-center space-x-2">
					<Button
						size="sm"
						class="rounded font-semibold"
						on:click={() => ($crtCollectionModal = true)}>New Collection</Button
					>

					<SortDropdown {sortOptions} bind:currentSort={$sort} />

					<ViewButtonsGroup bind:view>
						<ViewButton {view} value="grid">
							<LayoutGrid class="icon-md" />
						</ViewButton>
						<ViewButton {view} value="list">
							<StretchHorizontal class="icon-md" />
						</ViewButton>
					</ViewButtonsGroup>
				</div>
			</div>
			<div class={cn('flex flex-col gap-2', view === 'grid' && 'grid grid-cols-2 md:grid-cols-3')}>
				{#each sortedCollections as collection (collection.id)}
					<CollectionOverview {collection} {view} nItems={0} />
					<!-- TODO: add item count -->
				{/each}
			</div>
		</div>
	</PageContent>
</div>
