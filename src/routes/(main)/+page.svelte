<script lang="ts">
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Dna from 'lucide-svelte/icons/dna';
	import Egg from 'lucide-svelte/icons/egg';
	import FolderClock from 'lucide-svelte/icons/folder-clock';
	import FolderHeart from 'lucide-svelte/icons/folder-heart';
	import FolderPlus from 'lucide-svelte/icons/folder-plus';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { CollectionOverview, getCollectionState } from '$lib/components/collection';
	import { UserMenu } from '$lib/components/user';
	import { Button } from '$lib/components/base/index.js';
	import { getCrtCollectionModalState } from '$lib/states/index.js';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';

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
	<title>Dashboard - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader>
		<SidebarOpenBtn />
		<div class="block md:hidden">
			<UserMenu user={data.user} />
		</div>
	</PageHeader>

	<PageContent class="gap-y-5">
		{#if pinnedCollections.length > 0}
			<section class="space-y-1.5">
				<div class="flex items-center space-x-1.5">
					<FolderHeart class="size-4" />
					<h2 class="text-xl">Favorites Collections</h2>
				</div>
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
					<div class="flex items-center space-x-1.5">
						<FolderClock class="size-4" />
						<h2 class="text-xl">Recently updated</h2>
					</div>

					<Button href="/collections" theme="ghost" variant="icon">
						<ArrowRight />
					</Button>
				</div>

				<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
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

				<Button onclick={() => crtCollectionModal.open()} class="h-12 w-full">
					<FolderPlus />
					<span> Create Collection</span>
				</Button>

				<Button href="/templates" theme="secondary" class="h-12 w-full">
					<Dna />
					<span> Browser Templates</span>
				</Button>
			</div>
		{/if}
	</PageContent>
</PageContainer>
