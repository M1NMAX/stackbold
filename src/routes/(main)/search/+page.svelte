<script lang="ts">
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { Hash, Search } from 'lucide-svelte';
	import { SearchInput } from '$lib/components/filters';
	import type { Searchable } from '$lib/types';
	import { icons } from '$lib/components/icon';

	let { data } = $props();
	let search = $state('');

	let searchableItems = $derived.by(() => {
		const collections = data.collections.map(
			(collection) =>
				({
					id: collection.id,
					name: collection.name,
					type: 'collection',
					updatedAt: collection.updatedAt,
					icon: collection.icon
				}) as Searchable
		);

		return collections.concat(data.items);
	});

	let filtered = $derived.by(() => {
		const searchTerm = search.toLowerCase() || '';

		return [...searchableItems].filter((item) => item.name.toLowerCase().includes(searchTerm));
	});

	function getUrl(target: Searchable) {
		if (target.type === 'collection') {
			return `/collections/${target.id}`;
		} else {
			return `/collections/${target.collection.id}/item/${target.id}`;
		}
	}
</script>

<svelte:head>
	<title>Search - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader>
		<h1 class="text-xl font-semibold">{search.length > 0 ? 'Results' : 'Search'}</h1>
	</PageHeader>

	<PageContent class="grow">
		{#each filtered as item}
			<a
				href={getUrl(item)}
				data-testid="collection-overview"
				class="flex items-center p-1.5 space-x-2 rounded bg-secondary/40 hover:bg-secondary/60"
			>
				{@render searchableElement(item)}
			</a>
		{/each}
	</PageContent>

	<div class="p-2">
		<SearchInput bind:value={search} placeholder="Search" />
	</div>
</PageContainer>

{#snippet searchableElement(el: Searchable)}
	{#if el.type === 'collection'}
		{@const Icon = icons[el.icon]}

		<Icon class="size-5" />
		<span> {el.name} </span>
	{:else}
		<Hash class="size-5" />
		<span class="flex flex-col">
			<span> {el.name} </span>

			<span class="text-xs font-medium"> in {el.collection.name} </span>
		</span>
	{/if}
{/snippet}
