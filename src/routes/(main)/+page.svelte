<script lang="ts">
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Egg from 'lucide-svelte/icons/egg';
	import Plus from 'lucide-svelte/icons/plus';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page/index.js';
	import { CollectionOverview, getCollectionState } from '$lib/components/collection/index.js';
	import { UserMenu } from '$lib/components/user/index.js';
	import { Badge, Button, HSeparator } from '$lib/components/base/index.js';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';
	import { COLLECTION_ICONS, NEW_COLLECTION_NAME } from '$lib/constant/index.js';
	import { timeAgo } from '$lib/utils/index.js';

	let { data } = $props();

	const collectionState = getCollectionState();

	const updCollections = $derived.by(() => {
		return [...collectionState.collections]
			.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
			.slice(0, 8);
	});

	async function onclickNewCollection() {
		await collectionState.createCollection({ name: NEW_COLLECTION_NAME }, true);
	}
</script>

<svelte:head>
	<title>Dashboard - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader class="justify-start lg:justify-between">
		<SidebarOpenBtn />

		<div class="block lg:hidden">
			<UserMenu user={data.user} />
		</div>
	</PageHeader>

	<PageContent>
		{#if updCollections.length === 0}
			<div class="h-full max-w-lg flex flex-col justify-center gap-y-4 mx-auto">
				<div class="flex flex-col items-center">
					<Egg class="size-16 fill-primary text-primary" />
					<p class="text-center text-base font-medium">
						There has been no recent activity in this account.
					</p>
				</div>

				<Button onclick={onclickNewCollection} class="w-full">
					<Plus />
					<span> New collection</span>
				</Button>
			</div>
		{:else}
			<section class="space-y-1">
				<div class="flex items-centers justify-between">
					<h2 class="text-lg font-semibold">Recents</h2>

					<Button href="/collections" theme="ghost" variant="icon">
						<ArrowRight />
					</Button>
				</div>

				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
					{#each updCollections as collection (collection.id)}
						<CollectionOverview {collection} />
					{/each}
				</div>
			</section>
			<section class="mt-5 space-y-1">
				<h2 class="text-lg font-semibold">Recently added items</h2>

				<div>
					{#each data.items as item, i (item.id)}
						{@const Icon = COLLECTION_ICONS[item.collection.icon]}
						<a
							href={`/collections/${item.collection.id}/item/${item.id}`}
							class="flex items-center justify-between gap-x-1 py-1 px-1.5 rounded-sm hover:bg-secondary/70 cursor-pointer"
						>
							<Badge>
								<Icon />
								<span class="text-nowrap truncate"> {item.collection.name} </span>
							</Badge>

							<h2 class="grow text-base font-semibold text-nowrap truncate">{item.name}</h2>

							<span class="text-xs">
								{timeAgo(item.createdAt)}
							</span>
						</a>

						{#if i + 1 !== data.items.length}
							<HSeparator class="my-0.5" />
						{/if}
					{/each}
				</div>
			</section>
		{/if}
	</PageContent>
</PageContainer>
