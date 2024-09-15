<script lang="ts">
	import { ArrowUpDown, Database, FolderPlus } from 'lucide-svelte';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import { SearchInput } from '$lib/components/search';
	import { SortDropdown } from '$lib/components/sort';
	import type { Collection } from '@prisma/client';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { getCrtCollectionModalState } from '$lib/components/modal';
	import { CollectionOverview } from '$lib/components/collection';
	import { DEFAULT_SORT_OPTIONS } from '$lib/constant';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { getScreenState } from '$lib/components/view';
	import { Label } from '$lib/components/ui/label';

	let { data } = $props();

	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<Collection>[])];
	let sort = $state(sortOptions[0]);

	let search = $state('');
	let collections = $derived.by(() => {
		const searchTerm = search.toLowerCase() || '';

		return data.collections
			.filter((collection) => collection.name.toLowerCase().includes(searchTerm))
			.sort(sortFun(sort.field, sort.order));
	});

	const isDesktop = getScreenState();
	const crtCollectionModal = getCrtCollectionModalState();

	const SORT_STORAGE_KEY = 'collection-sort';
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
	<PageHeader />
	<PageContent>
		<div class="flex items-center space-x-2">
			<Database class="icon-lg" />
			<h1 class="font-semibold text-2xl">Collections</h1>
		</div>

		<div class="space-y-2">
			{#if $isDesktop}
				<div class="flex justify-between space-x-2">
					<SearchInput placeholder="Find Collection" bind:value={search} />

					<SortDropdown options={sortOptions} bind:value={sort} />
					<Button onclick={() => crtCollectionModal.openModal()}>New Collection</Button>
				</div>
			{:else}
				<div class="flex space-x-1">
					<SearchInput placeholder="Find Collection" bind:value={search} />
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
									value={sort.field + '-' + sort.order}
									class="px-2 py-1 rounded-md bg-secondary"
								>
									{#each sortOptions as sortOpt}
										<Label class="flex items-center justify-between space-x-2">
											<span class="font-semibold text-lg"> {sortOpt.label} </span>
											<RadioGroup.Item
												value={sortOpt.field + '-' + sortOpt.order}
												id={sortOpt.label}
												on:click={() => {
													sort = { ...sortOpt };
												}}
											/>
										</Label>
									{/each}
								</RadioGroup.Root>
							</Drawer.Footer>
						</Drawer.Content>
					</Drawer.Root>
				</div>
			{/if}

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

		{#if !$isDesktop}
			<Button
				size="icon"
				class="fixed bottom-4 right-3 z-10 h-12 w-12 rounded-md"
				onclick={() => crtCollectionModal.openModal()}
			>
				<FolderPlus />
			</Button>
		{/if}
	</PageContent>
</PageContainer>
