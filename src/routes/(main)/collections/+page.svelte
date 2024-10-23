<script lang="ts">
	import { Plus, LibraryBig } from 'lucide-svelte';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import { SearchInput, SortMenu } from '$lib/components/filters';
	import type { Collection } from '@prisma/client';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { getCrtCollectionModalState } from '$lib/components/modal';
	import { CollectionOverview, getCollectionState } from '$lib/components/collection';
	import { DEFAULT_SORT_OPTIONS } from '$lib/constant';
	import { UserMenu } from '$lib/components/user';

	let { data } = $props();

	const collectionState = getCollectionState();
	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<Collection>[])];
	let sort = $state(sortOptions[0]);

	let search = $state('');
	let collections = $derived.by(() => {
		const searchTerm = search.toLowerCase() || '';

		return collectionState.collections
			.filter((collection) => collection.name.toLowerCase().includes(searchTerm))
			.sort(sortFun(sort.field, sort.order));
	});

	const crtCollectionModal = getCrtCollectionModalState();

	const SORT_STORAGE_KEY = 'collection-sort';
	$effect(() => {
		const savedSort = localStorage.getItem(SORT_STORAGE_KEY);
		if (savedSort) sort = JSON.parse(savedSort);
	});

	$effect(() => {
		localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sort));
	});
	let isSmHeadingVisible = $state(false);
	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}
</script>

<svelte:head>
	<title>Collections - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader>
		<div class={cn('grow flex items-center space-x-2', !isSmHeadingVisible && 'md:hidden')}>
			<LibraryBig class="icon-md" />
			<h1 class="text-xl font-semibold">Collections</h1>
		</div>

		<div class=" flex md:hidden items-center space-x-2">
			<Button size="icon" variant="ghost" onclick={() => crtCollectionModal.open()}>
				<Plus />
			</Button>
			<UserMenu user={data.user} />
		</div>
	</PageHeader>
	<PageContent onScroll={handleScroll}>
		<div class=" hidden md:flex items-center space-x-2">
			<LibraryBig class="icon-lg" />
			<h1 class="font-semibold text-2xl">Collections</h1>
		</div>

		<div class="space-y-2">
			<div class="w-full flex justify-between space-x-1 md:space-x-2">
				<SearchInput placeholder="Find Collection" bind:value={search} />

				<SortMenu options={sortOptions} bind:value={sort} />
				<Button class="hidden md:flex" onclick={() => crtCollectionModal.open()}>
					New Collection
				</Button>
			</div>

			{#if collections.length > 0}
				<div class={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2')}>
					{#each collections as collection (collection.id)}
						<CollectionOverview {collection} />
					{/each}
				</div>
			{:else}
				<p class="py-10 text-center text-lg font-semibold">No collection found</p>
			{/if}
		</div>
	</PageContent>
</PageContainer>
