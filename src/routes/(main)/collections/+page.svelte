<script lang="ts">
	import type { PageData } from './$types';
	import { Database } from 'lucide-svelte';
	import { PageContent } from '$lib/components/page';
	import { sortFun } from '$lib/utils/sort';
	import debounce from 'debounce';
	import { SearchInput } from '$lib/components/search';
	import { setSortState, SortDropdown, sortOptions } from '$lib/components/sort';
	import { ICON_COLORS, icons } from '$lib/components/icon';
	import { cn } from '$lib/utils';

	export let data: PageData;
	$: ({ collections } = data);

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

	$: sortedCollections = collections.sort(sortFun($sort.field, $sort.order));
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
		<!-- TODO: create page description -->
		<p>Page description</p>

		<div class="space-y-2">
			<div class="flex justify-between space-x-2">
				<div class="w-1/3 flex justify-between items-center space-x-2">
					<SearchInput placeholder="Find Collection" on:input={handleOnInputSearch} />
				</div>
				<div class="flex justify-between items-center space-x-2">
					<SortDropdown {sortOptions} bind:currentSort={$sort} />
				</div>
			</div>
			<div class="space-y-2">
				{#each sortedCollections as collection}
					<a
						href="/collections/{collection.id}"
						class="flex flex-col items-start py-1 px-2 space-y-2 rounded bg-secondary/40 hover:bg-secondary/60"
					>
						<div class="flex items-center justify-between space-x-2">
							<svelte:component
								this={icons[collection.icon.name]}
								class={cn('icon-md', ICON_COLORS[collection.icon.color])}
							/>
							<h2 class="text-lg font-semibold">
								{collection.name}
							</h2>
						</div>

						<p class="font-normal text-gray-700 dark:text-gray-400 leading-tight">
							{collection.description}
						</p>
					</a>
				{/each}
			</div>
		</div>
	</PageContent>
</div>
