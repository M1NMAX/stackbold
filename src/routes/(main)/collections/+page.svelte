<script lang="ts">
	import Plus from 'lucide-svelte/icons/plus';
	import { PageContainer, PageContent, PageHeader, PageTitle } from '$lib/components/page/index.js';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import { SortMenu } from '$lib/components/view/index.js';
	import type { Collection } from '@prisma/client';
	import { CollectionOverview, getCollectionState } from '$lib/components/collection/index.js';
	import { DEFAULT_SORT_OPTIONS, NEW_COLLECTION_NAME } from '$lib/constant/index.js';
	import { UserMenu } from '$lib/components/user/index.js';
	import { Button, ExpandableSearchInput, VSelector } from '$lib/components/base/index.js';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';

	let { data } = $props();

	const TAB_OPTIONS = [
		{
			id: 'all',
			label: 'All'
		},
		{
			id: 'favourites',
			label: 'Favourites',
			icon: 'star'
		}
	];

	const SORT_STORAGE_KEY = 'collection-sort';
	const collectionState = getCollectionState();
	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<Collection>[])];

	let tab = $state(TAB_OPTIONS[0].id);
	let sort = $state(sortOptions[0]);
	let isSmHeadingVisible = $state(false);

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

	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}

	$effect(() => {
		const savedSort = localStorage.getItem(SORT_STORAGE_KEY);
		if (savedSort) sort = JSON.parse(savedSort);
	});

	$effect(() => {
		localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sort));
	});
</script>

<svelte:head>
	<title>Collections - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader>
		<SidebarOpenBtn />

		<div class="w-full flex lg:hidden items-center justify-between gap-x-2">
			<UserMenu user={data.user} />
			<PageTitle
				small
				icon="collections"
				title="Collections"
				class={isSmHeadingVisible ? 'flex-1' : 'grow flex lg:hidden'}
			/>

			<Button theme="secondary" variant="icon" onclick={() => createCollection()}>
				<Plus />
			</Button>
		</div>
	</PageHeader>
	<PageContent onscroll={handleScroll}>
		<div class="hidden lg:flex items-center justify-between pb-2">
			<PageTitle icon="collections" title="Collections" class="hidden lg:flex" />

			<Button class="hidden md:flex" onclick={() => createCollection()}>
				<Plus />
				<span> New collection </span>
			</Button>
		</div>
		<div class="space-y-2">
			<div class="w-full flex justify-between gap-x-1 md:gap-x-2">
				<VSelector value={tab} options={TAB_OPTIONS} onchange={(v) => (tab = v)}></VSelector>

				<div class="flex items-center">
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
				<p class="py-10 text-center text-lg font-semibold">No collection found</p>
			{/if}
		</div>
	</PageContent>
</PageContainer>
