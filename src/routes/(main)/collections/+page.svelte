<script lang="ts">
	import type { PageData } from './$types';

	import { Database, Folder } from 'lucide-svelte';
	import { PageContent } from '$lib/components/page';
	import { SidebarButton } from '$lib/components/sidebar';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import debounce from 'debounce';
	import { DEFAULT_DEBOUNCE_INTERVAL } from '$lib/constant';
	import { SearchInput } from '$lib/components/search';
	import { SortDropdown } from '$lib/components/sort';

	export let data: PageData;

	const sortOptions: SortOption[] = [
		{ label: 'By name (A-Z)', field: 'name', order: 'asc' },
		{ label: 'By name (Z-A)', field: 'name', order: 'desc' },
		{ label: 'By lastest updated', field: 'updatedAt', order: 'asc' },
		{ label: 'By oldest updated', field: 'updatedAt', order: 'desc' },
		{ label: 'By Recently added ', field: 'createdAt', order: 'asc' },
		{ label: 'By oldest added', field: 'createdAt', order: 'desc' }
	];
	let currentSort: SortOption = sortOptions[0];

	// SEARCH

	const debounceSearch = debounce((query: string) => {
		sortedCollections = sortedCollections.filter(({ name, description }) => {
			return name.toLowerCase().includes(query) || description.toLowerCase().includes(query);
		});
	}, DEFAULT_DEBOUNCE_INTERVAL * 0.5);

	function handleOnInputSearch(e: Event) {
		const value = (e.target as HTMLInputElement).value;

		if (value.length > 2) debounceSearch(value);
		else sortedCollections = data.collections.sort(sortFun(currentSort.field, currentSort.order));
	}

	$: sortedCollections = data.collections.sort(sortFun(currentSort.field, currentSort.order));
</script>

<svelte:head>
	<title>Collections - Stackbold</title>
</svelte:head>

<div class="grow rounded-md bg-card text-secondary-foreground overflow-hidden">
	<PageContent>
		<SidebarButton />
		<div class="flex items-center space-x-2">
			<Database class="icon-lg" />
			<h1 class="font-semibold text-2xl">Collections</h1>
		</div>

		<div class="space-y-2">
			<div class="flex justify-between space-x-2">
				<div class="w-1/3 flex justify-between items-center space-x-2">
					<SearchInput placeholder="Find Collection" on:input={handleOnInputSearch} />
				</div>
				<div class="flex justify-between items-center space-x-2">
					<SortDropdown {sortOptions} bind:currentSort />
				</div>
			</div>
			<div class="space-y-2">
				{#each sortedCollections as collection}
					<a
						href="/collections/{collection.id}"
						class="flex flex-col items-start py-1 px-2 space-y-2 rounded bg-secondary/40 hover:bg-secondary/60"
					>
						<div class="flex items-center justify-between space-x-2">
							<Folder />
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
