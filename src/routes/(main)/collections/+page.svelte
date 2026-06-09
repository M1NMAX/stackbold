<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import { PageContainer } from '$lib/components/page/index.js';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import { SortMenu } from '$lib/components/view/index.js';
	import type { Collection } from '@prisma/client';
	import { CollectionOverview, getCollectionState } from '$lib/components/collection/index.js';
	import { DEFAULT_SORT_OPTIONS, NEW_COLLECTION_NAME, PAGE_ICONS } from '$lib/constant/index.js';
	import { Button, Empty, ExpandableSearchInput, VSelector } from '$lib/components/base/index.js';

	const TAB_OPTIONS = [
		{ id: 'all', label: 'All' },
		{ id: 'favourites', label: 'Favourites' }
	];

	const SORT_STORAGE_KEY = 'collection-sort';
	const collectionState = getCollectionState();
	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<Collection>[])];

	let tab = $state(TAB_OPTIONS[0].id);
	let sort = $state(sortOptions[0]);

	let search = $state('');
	let collections = $derived.by(() => {
		const searchTerm = search.toLowerCase() || '';

		return collectionState.collections
			.filter((collection) => {
				const match = collection.name.toLowerCase().includes(searchTerm);
				if (tab == 'all') return match;
				else return collection.isPinned && match;
			})
			.sort(sortFun(sort.field, sort.order));
	});

	async function createCollection() {
		await collectionState.createCollection({ name: NEW_COLLECTION_NAME }, true);
	}

	$effect(() => {
		const savedSort = localStorage.getItem(SORT_STORAGE_KEY);
		if (savedSort) sort = JSON.parse(savedSort);
	});

	$effect(() => {
		localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sort));
	});
</script>

<PageContainer icon="collections" title="Collections" isBase>
	{#snippet topActions()}
		<Button
			theme="secondary"
			variant="icon"
			class="flex lg:hidden"
			onclick={() => createCollection()}
		>
			<Plus />
		</Button>
	{/snippet}
	{#snippet actionsRow()}
		{@const Icon = PAGE_ICONS['collections']}
		<Icon />

		<h1 class="grow text-2xl font-semibold">Collections</h1>

		<Button class="hidden md:flex" onclick={() => createCollection()}>
			<Plus />
			<span> New collection </span>
		</Button>
	{/snippet}

	<div class="w-full flex justify-between gap-x-1 lg:gap-x-1.5">
		<VSelector value={tab} options={TAB_OPTIONS} onchange={(v) => (tab = v)}></VSelector>

		<div class="flex items-center gap-x-1 lg:gap-x-1.5">
			<ExpandableSearchInput placeholder="Find collection" bind:value={search} />
			<SortMenu options={sortOptions} bind:value={sort} />
		</div>
	</div>

	{#if collections.length > 0}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
			{#each collections as collection (collection.id)}
				<CollectionOverview {collection} />
			{/each}
		</div>
	{:else}
		<Empty text="No results " />
	{/if}
</PageContainer>
