<script lang="ts">
	import type { PageData } from './$types';
	import { onDestroy } from 'svelte';
	import { Database } from 'lucide-svelte';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import { SearchInput, createSearchStore, searchHandler } from '$lib/components/search';
	import { setSortState, SortDropdown } from '$lib/components/sort';
	import type { Collection } from '@prisma/client';
	import { capitalizeFirstLetter, cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { getModalState } from '$lib/components/modal';
	import { CollectionOverview } from '$lib/components/collection';

	export let data: PageData;

	type Filters = 'all' | 'favourites' | 'archived';
	let filter: Filters = 'all';

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

	function setFilter(newFilter: string) {
		filter = newFilter as Filters;
	}

	function filterCollections() {
		switch (filter) {
			case 'all':
				return searchCollections;
			case 'favourites':
				return searchCollections.filter((collection) => collection.isFavourite);
			case 'archived':
				return searchCollections.filter((collection) => collection.isArchived);
		}
	}

	// SEARCH
	const searchCollections = data.collections.map((collection) => ({
		...collection,
		searchTerms: collection.name
	}));

	const searchStore = createSearchStore(searchCollections);

	const unsubscribe = searchStore.subscribe((model) => searchHandler(model));

	onDestroy(() => {
		unsubscribe();
	});

	$: $sort, ($searchStore.filtered = $searchStore.data.sort(sortFun($sort.field, $sort.order)));
	$: filter, ($searchStore.data = filterCollections());
</script>

<svelte:head>
	<title>Collections - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader />
	<PageContent>
		<div class="flex items-center space-x-2">
			<Database class="icon-lg" />
			<h1 class="font-semibold text-2xl">Collections</h1>
		</div>

		<div class="space-y-2">
			<div class="flex justify-between space-x-2">
				<div class="w-1/3 flex justify-between items-center space-x-2">
					<SearchInput placeholder="Find Collection" bind:value={$searchStore.search} />
				</div>

				<div class="space-x-1">
					{#each ['all', 'favourites', 'archived'] as item}
						<Button
							variant={filter === item ? 'secondary' : 'ghost'}
							size="sm"
							on:click={() => setFilter(item)}
						>
							{capitalizeFirstLetter(item)}
						</Button>
					{/each}
				</div>
				<div class="flex justify-between items-center space-x-2">
					<Button size="sm" on:click={() => ($crtCollectionModal = true)}>New Collection</Button>

					<SortDropdown {sortOptions} bind:currentSort={$sort} />
				</div>
			</div>

			{#if $searchStore.filtered.length > 0}
				<div class={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2')}>
					{#each $searchStore.filtered as collection (collection.id)}
						<CollectionOverview {collection} />
					{/each}
				</div>
			{:else}
				<p class="py-10 text-center text-lg font-semibold">No collection found</p>
			{/if}
		</div>
	</PageContent>
</PageContainer>
