<script lang="ts">
	import type { PageData } from './$types';
	import { onDestroy } from 'svelte';
	import { ArrowUpDown, Database, FolderPlus, ListFilter } from 'lucide-svelte';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import { SearchInput, createSearchStore, searchHandler } from '$lib/components/search';
	import { SortDropdown } from '$lib/components/sort';
	import type { Collection } from '@prisma/client';
	import { capitalizeFirstLetter, cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { getCrtCollectionDialogState } from '$lib/components/modal';
	import { CollectionOverview } from '$lib/components/collection';
	import { storage } from '$lib/storage';
	import { DEFAULT_SORT_OPTIONS } from '$lib/constant';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { getScreenState } from '$lib/components/view';
	import { Label } from '$lib/components/ui/label';

	export let data: PageData;

	type Filters = 'all' | 'favourites' | 'archived';
	let filter: Filters = 'all';
	const crtCollectionDialog = getCrtCollectionDialogState();

	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<Collection>[])];
	const sort = storage('sort-collections', sortOptions[0]);
	const isDesktop = getScreenState();

	function openCrtCollectionDialog() {
		$crtCollectionDialog = { defaultGroup: undefined, open: true };
	}

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

	function addSearchTerms() {
		return data.collections.map((collection) => ({
			...collection,
			searchTerms: collection.name
		}));
	}
	const searchCollections = addSearchTerms();

	const searchStore = createSearchStore(searchCollections);

	const unsubscribe = searchStore.subscribe((model) => searchHandler(model));

	onDestroy(() => {
		unsubscribe();
	});

	$: $sort, ($searchStore.filtered = $searchStore.data.sort(sortFun($sort.field, $sort.order)));
	$: filter, ($searchStore.data = filterCollections());
	$: data, ($searchStore.data = addSearchTerms().sort(sortFun($sort.field, $sort.order)));
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
			{#if $isDesktop}
				<div class="flex justify-between space-x-2">
					<SearchInput placeholder="Find Collection" bind:value={$searchStore.search} />

					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild let:builder>
							<Button builders={[builder]} variant="secondary" size="sm" class="h-9">
								<ListFilter />
								<span class="sr-only"> {filter} </span>
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-44">
							<DropdownMenu.Label>Filter</DropdownMenu.Label>
							<DropdownMenu.Separator />

							<DropdownMenu.Group>
								{#each ['all', 'favourites', 'archived'] as option}
									<DropdownMenu.CheckboxItem
										checked={option === filter}
										on:click={() => setFilter(option)}
									>
										{capitalizeFirstLetter(option)}
									</DropdownMenu.CheckboxItem>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>

					<SortDropdown {sortOptions} bind:currentSort={$sort} />
					<Button on:click={openCrtCollectionDialog}>New Collection</Button>
				</div>
			{:else}
				<div class="flex space-x-1">
					<SearchInput placeholder="Find Collection" bind:value={$searchStore.search} />
					<Drawer.Root>
						<Drawer.Trigger asChild let:builder>
							<Button builders={[builder]} variant="secondary">
								<ArrowUpDown class="icon-sm" />
							</Button>
						</Drawer.Trigger>
						<Drawer.Content>
							<Drawer.Header class="py-1">
								<div class="flex items-center space-x-2">
									<div class="p-2.5 rounded bg-secondary">
										<ArrowUpDown class="icon-sm" />
									</div>
									<div class="text-base font-semibold">Sort By</div>
								</div>
							</Drawer.Header>
							<Drawer.Footer>
								<RadioGroup.Root
									id="sort"
									value={$sort.field + '-' + $sort.order}
									class="px-2 py-1 rounded-md bg-secondary"
								>
									{#each sortOptions as sortOpt}
										<Label class="flex items-center justify-between space-x-2">
											<span class="font-semibold text-lg"> {sortOpt.label} </span>
											<RadioGroup.Item
												value={sortOpt.field + '-' + sortOpt.order}
												id={sortOpt.label}
												on:click={() => {
													$sort = { ...sortOpt };
												}}
											/>
										</Label>
									{/each}
								</RadioGroup.Root></Drawer.Footer
							>
						</Drawer.Content>
					</Drawer.Root>
				</div>
			{/if}

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

		{#if !$isDesktop}
			<Button
				size="icon"
				class="fixed bottom-4 right-3 z-10 h-12 w-12 rounded-full"
				on:click={openCrtCollectionDialog}
			>
				<FolderPlus />
			</Button>
		{/if}
	</PageContent>
</PageContainer>
