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

		<Card
			href="/templates"
			class="flex flex-row items-center justify-between py-1.5 px-2 [&>svg]:size-4"
		>
			<Dna />
			<span class="grow">Browser templates </span>
			<ArrowRight />
		</Card>

		<section class="space-y-1 mt-1">
			<h2 class="px-1 text-base font-semibold">Recently added items</h2>
			<div class="space-y-1.5">
				{#each data.items as item, i (item.id)}
					{@const Icon = COLLECTION_ICONS[item.collection.icon]}
					<Card
						href={`/collections/${item.collection.id}/item/${item.id}`}
						class="flex flex-row items-center justify-between py-1 px-1.5"
					>
						<Badge>
							<Icon />
							<span class="text-nowrap truncate"> {item.collection.name} </span>
						</Badge>

						<h2 class="grow text-base font-semibold text-nowrap truncate">{item.name}</h2>

						<span class="text-xs shrink-0">
							{timeAgo(item.createdAt)}
						</span>
					</Card>
				{/each}
			</div>
		</section>
	{/if}
</PageContainer>
