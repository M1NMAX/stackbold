<script lang="ts">
	import Hash from '@lucide/svelte/icons/hash';
	import { PageContainer } from '$lib/components/page';
	import { Empty, HSeparator, SearchInput } from '$lib/components/base/index.js';
	import type { SearchableCollection, SearchableCollectionAsOption } from '$lib/types';
	import { COLLECTION_ICONS } from '$lib/constant/icons.js';
	import { getCollectionState, getCollectionView } from '$lib/components/collection/index.js';
	import { applyFilter, escapeRegex, preSearchData, tm, useId } from '$lib/utils/index.js';
	import { tick } from 'svelte';
	import { DEBOUNCE_INTERVAL } from '$lib/constant/index.js';
	import { trpc } from '$lib/trpc/client.js';

	import { getToastState } from '$lib/states/index.js';

	const toastState = getToastState();
	const searchInputId = useId();
	const collectionState = getCollectionState();

	let search = $state('');
	let result = $state<SearchableCollection[]>([]);
	let filtered = $state<SearchableCollection[]>([]);
	let hasFetched = $state(false);
	let isLoading = $state(false);

	$effect(() => {
		const escaped = escapeRegex(search);

		if (escaped.length < 3) {
			result = [];
			filtered = preSearchData(collectionState.collections);
			hasFetched = false;
			return;
		}

		if (hasFetched) {
			filtered = applyFilter(result, escaped);
			return;
		}

		let cancelled = false;
		isLoading = true;
		const timer = setTimeout(async () => {
			try {
				const data = await trpc().collections.search.query(escaped);
				if (cancelled) return;

				result = data;
				filtered = applyFilter(data, escaped);
				hasFetched = true;
			} catch (err) {
				if (!cancelled) toastState.error();
			} finally {
				if (!cancelled) isLoading = false;
			}
		}, DEBOUNCE_INTERVAL / 4);

		return () => {
			cancelled = true;
			clearTimeout(timer);
			isLoading = false;
		};
	});

	$effect(() => {
		const inputEl = document.getElementById(searchInputId) as HTMLInputElement;
		if (!inputEl) return;
		tick().then(() => inputEl.focus());
	});
</script>

<PageContainer title="Search" isBase>
	<SearchInput id={searchInputId} bind:value={search} placeholder="Find collections and items" />

	{#if isLoading}
		{@render skeleton()}
	{:else if filtered.length > 0}
		{@const isRecent = result.length === 0}
		<div>
			<p class="text-sm font-medium px-0.5 pb-0.5">{isRecent ? 'Recents' : 'Results'}</p>

			{#each filtered as collection, i (collection.id)}
				{#if i !== 0}
					<HSeparator class="my-0.5" />
				{/if}
				{@render option({
					id: collection.id,
					name: collection.name,
					icon: collection.icon,
					type: 'collection',
					url: `/collections/${collection.id}?view=${getCollectionView(collection)}`
				})}

				{#each collection.items as item (item.id)}
					{@render option({
						id: item.id,
						name: item.name,
						type: 'item',
						url: `/collections/${collection.id}/item/${item.id}`
					})}
				{/each}
			{/each}
		</div>
	{:else}
		{@const isSearchResult = search.length > 3 && filtered.length === 0}
		<Empty text={isSearchResult ? 'No results' : 'There has been no recent activity'} />
	{/if}
</PageContainer>

{#snippet option(opt: SearchableCollectionAsOption)}
	{#if 'url' in opt}
		<a
			href={opt.url}
			class={tm(
				'flex items-center py-1.5 px-2 font-medium rounded-sm hover:bg-secondary/70 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
				opt.type === 'item' ? 'pl-4' : ''
			)}
		>
			{#if opt.type === 'item'}
				<span
					class="relative flex-shrink-0 w-3 h-5 before:absolute before:left-0 before:-top-2.5 before:bottom-1/2 before:w-2 before:h-full before:border-l before:border-b before:rounded-bl-sm before:border-secondary-foreground"
				>
				</span>
			{/if}

			{#if opt.icon}
				{@const Icon = COLLECTION_ICONS[opt.icon]}
				<Icon />
			{:else}
				<Hash />
			{/if}

			<span class="ml-2"> {opt.name}</span>
		</a>
	{/if}
{/snippet}
{#snippet skeleton()}
	<div class="flex flex-col gap-y-2 p-1">
		{#each { length: 20 } as s}
			<div class="h-6 w-full flex items-center gap-x-2">
				<span class="size-5 rounded-md bg-secondary/50"> </span>
				<span class=" grow h-5 rounded-md bg-secondary/50"> </span>
			</div>
		{/each}
	</div>
{/snippet}
