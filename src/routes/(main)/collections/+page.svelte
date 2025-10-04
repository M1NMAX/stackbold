<script lang="ts">
	import Plus from 'lucide-svelte/icons/plus';
	import { PageContainer, PageContent, PageHeader, PageTitle } from '$lib/components/page/index.js';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import { SearchInput, SortMenu } from '$lib/components/view/index.js';
	import type { Collection } from '@prisma/client';
	import { tm } from '$lib/utils/index.js';
	import { CollectionOverview, getCollectionState } from '$lib/components/collection/index.js';
	import { DEFAULT_SORT_OPTIONS, NEW_COLLECTION_NAME } from '$lib/constant/index.js';
	import { UserMenu } from '$lib/components/user/index.js';
	import { Button } from '$lib/components/base/index.js';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';

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

	async function createCollection() {
		await collectionState.createCollection({ name: NEW_COLLECTION_NAME }, true);
	}
</script>

<svelte:head>
	<title>Collections - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader>
		<SidebarOpenBtn />
		<PageTitle
			small
			icon="collections"
			title="Collections 1"
			class={isSmHeadingVisible ? 'flex-1' : 'flex lg:hidden'}
		/>

		<div class="flex lg:hidden items-center space-x-2">
			<Button theme="ghost" variant="icon" onclick={() => createCollection()}>
				<Plus />
			</Button>
			<UserMenu user={data.user} />
		</div>
	</PageHeader>
	<PageContent onscroll={handleScroll}>
		<PageTitle icon="collections" title="Collections" class="hidden lg:flex" />

		<div class="space-y-2">
			<div class="w-full flex justify-between space-x-1 md:space-x-2">
				<SearchInput placeholder="Find Collection" bind:value={search} />

				<SortMenu options={sortOptions} bind:value={sort} />
				<Button class="hidden md:flex" onclick={() => createCollection()}>New</Button>
			</div>

			{#if collections.length > 0}
				<div class={tm('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2')}>
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
