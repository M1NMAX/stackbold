<script lang="ts">
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { ArrowRight, Dna, Egg, FolderPlus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { CollectionOverview, getCollectionState } from '$lib/components/collection';
	import { getCrtCollectionModalState } from '$lib/components/modal';
	import { UserMenu } from '$lib/components/user';

	let { data } = $props();

	const collectionState = getCollectionState();
	let pinnedCollections = $derived.by(() => {
		return collectionState.collections.filter((collection) => collection.isPinned);
	});

	let updCollections = $derived.by(() => {
		// return the 8 most recently updated collections
		return [...collectionState.collections]
			.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
			.slice(0, 8);
	});

	const crtCollectionModal = getCrtCollectionModalState();
</script>

<svelte:head>
	<title>Home - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader class="flex justify-between">
		<h1 class="font-semibold text-xl">Dashboard</h1>
		<div class="block md:hidden">
			<UserMenu user={data.user} />
		</div>
	</PageHeader>

	<PageContent class="space-y-5">
		{#if pinnedCollections.length > 0}
			<section class="space-y-1.5">
				<h2 class="text-xl">Pinned Collections</h2>

				<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
					{#each pinnedCollections as collection (collection.id)}
						<CollectionOverview {collection} />
					{/each}
				</div>
			</section>
		{/if}

		{#if updCollections.length > 0}
			<section class="mt-10 space-y-1.5">
				<div class="flex items-centers justify-between">
					<h2 class="text-xl">Recently updated collections</h2>

					<Button href="/collections" variant="ghost" size="icon">
						<ArrowRight />
					</Button>
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

				<Button on:click={() => crtCollectionModal.open()} class="h-12 w-full">
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
