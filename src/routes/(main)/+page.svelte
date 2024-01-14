<script lang="ts">
	import type { PageData } from './$types';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { ArrowRight } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { CollectionOverview } from '$lib/components/collection';
	import type { RouterOutputs } from '$lib/trpc/router';

	export let data: PageData;
	$: ({ user, collections } = data);

	$: updCollections = getUpdCollections(collections);

	type CollectionArray = RouterOutputs['collections']['list'];
	function getUpdCollections(collections: CollectionArray) {
		const sorted = collections.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

		// return the first 9 most recent collection
		return sorted.slice(0, 10);
	}
</script>

<svelte:head>
	<title>Home - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader />
	<PageContent class="space-y-5">
		<h1 class="font-semibold text-2xl">Welcome back, {user.name}!</h1>

		<section class="space-y-1.5">
			<h2 class="text-xl">Favourites Collections</h2>

			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
				{#each collections as collection (collection.id)}
					{#if collection.isFavourite}
						<CollectionOverview {collection} />
					{/if}
				{/each}
			</div>
		</section>

		<section class="mt-10 space-y-1.5">
			<div class="flex items-centers justify-between">
				<h2 class="text-xl">Recently updated collections</h2>

				<Button href="/collections" variant="ghost" size="icon"><ArrowRight /></Button>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
				{#each updCollections as collection}
					<CollectionOverview {collection} />
				{/each}
			</div>
		</section>
	</PageContent>
</PageContainer>
