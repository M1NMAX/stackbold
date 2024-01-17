<script lang="ts">
	import type { PageData } from './$types';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { ArrowRight, Dna, Egg, FolderPlus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { CollectionOverview } from '$lib/components/collection';
	import type { RouterOutputs } from '$lib/trpc/router';
	import { getModalState } from '$lib/components/modal';

	export let data: PageData;
	$: ({ user, collections } = data);

	$: favCollections = getFavCollections(collections);
	$: updCollections = getUpdCollections(collections);

	const crtCollectionModal = getModalState();

	type CollectionArray = RouterOutputs['collections']['list'];
	function getFavCollections(collections: CollectionArray) {
		return collections.filter((collection) => collection.isFavourite);
	}

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

		{#if favCollections.length > 0}
			<section class="space-y-1.5">
				<h2 class="text-xl">Favourites Collections</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
					{#each favCollections as collection (collection.id)}
						<CollectionOverview {collection} />
					{/each}
				</div>
			</section>
		{/if}

		{#if updCollections.length > 0}
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
		{:else}
			<div class="grid grid-cols-1 gap-2 max-w-lg mx-auto">
				<div class="flex flex-col items-center justify-between py-10">
					<Egg class="size-16 fill-primary text-primary" />

					<p class="text-xl font-medium">Wow, such empty</p>
				</div>

				<Button on:click={() => ($crtCollectionModal = true)} class="h-12 w-full">
					<FolderPlus />
					<span> Create Collection</span>
				</Button>

				<Button href="/templates" variant="secondary" class="h-12 w-full">
					<Dna />
					<span> Browser Templates</span>
				</Button>
			</div>
		{/if}
	</PageContent>
</PageContainer>
