<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Dna from '@lucide/svelte/icons/dna';
	import Plus from '@lucide/svelte/icons/plus';
	import { PageContainer } from '$lib/components/page/index.js';
	import { CollectionOverview, getCollectionState } from '$lib/components/collection/index.js';
	import { Badge, Button, Card, Empty, HSeparator } from '$lib/components/base/index.js';
	import { COLLECTION_ICONS, NEW_COLLECTION_NAME } from '$lib/constant/index.js';
	import { timeAgo } from '$lib/utils/index.js';

	let { data } = $props();

	const collectionState = getCollectionState();

	async function onclickNewCollection() {
		await collectionState.createCollection({ name: NEW_COLLECTION_NAME }, true);
	}
</script>

<PageContainer icon="dashboard" title="Dashboard" isBase contentClass="gap-y-3">
	{#if data.collections.length === 0}
		<div class="h-full max-w-lg flex flex-col justify-center gap-y-4 mx-auto">
			<Empty icon text="There has been no recent activity in this account" class="h-auto" />

			<Button onclick={onclickNewCollection} class="w-full">
				<Plus />
				<span> New collection</span>
			</Button>
		</div>
	{:else}
		<section class="space-y-1">
			<div class="flex items-center justify-between">
				<h2 class="text-base font-semibold">Recents</h2>

				<Button href="/collections" theme="ghost" variant="cicon">
					<ArrowRight />
				</Button>
			</div>

			<div class="w-full flex gap-x-2 overflow-x-auto hd-scroll">
				{#each data.collections as collection (collection.id)}
					<CollectionOverview {collection} class="min-w-36 lg:min-w-40" />
				{/each}
			</div>
		</section>

		<section>
			<h2 class="px-1 text-base font-semibold">Recently updated</h2>
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

					<span class="grow text-base font-semibold text-nowrap truncate">{item.name}</span>

					<span class="text-xs shrink-0">
						{timeAgo(item.updatedAt)}
					</span>
				</a>

				{#if i + 1 !== data.items.length}
					<HSeparator class="my-0.5" />
				{/if}
			{/each}
		</section>
		<Card
			href="/templates"
			class="flex flex-row items-center justify-between py-1.5 px-2 [&>svg]:size-4"
		>
			<Dna />
			<span class="grow">Browse templates </span>
			<ArrowRight />
		</Card>
	{/if}
</PageContainer>
