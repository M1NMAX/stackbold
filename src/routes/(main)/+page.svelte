<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Plus from '@lucide/svelte/icons/plus';
	import { PageContainer } from '$lib/components/page/index.js';
	import { CollectionOverview, getCollectionState } from '$lib/components/collection/index.js';
	import { Badge, Button, Card, Empty } from '$lib/components/base/index.js';
	import { COLLECTION_ICONS, NEW_COLLECTION_NAME, THEME_COLORS } from '$lib/constant/index.js';
	import { timeAgo, tm } from '$lib/utils/index.js';
	import { Color } from '@prisma/client';

	let { data } = $props();

	const collectionState = getCollectionState();

	async function onclickNewCollection() {
		await collectionState.createCollection({ name: NEW_COLLECTION_NAME }, true);
	}
</script>

<PageContainer icon="dashboard" title="Dashboard" isBase contentClass="gap-y-3 px-0 md:px-0">
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
			<div class="flex items-center justify-between px-2">
				<span class="text-base font-semibold">Recents</span>

				<Button href="/collections" theme="ghost" variant="cicon">
					<ArrowRight />
				</Button>
			</div>

			<div class="w-full flex gap-x-2 overflow-x-auto hd-scroll">
				{#each data.collections as collection (collection.id)}
					<CollectionOverview {collection} class="min-w-36 lg:min-w-40 first:ml-2 last:ml-2" />
				{/each}
			</div>
		</section>

		<section class="space-y-1 px-2">
			<h2 class="px-1 text-base font-semibold">Recently updated</h2>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-x-2 gap-y-1.5 lg:gap-y-2">
				{#each data.items as item (item.id)}
					{@const Icon = COLLECTION_ICONS[item.collection.icon]}
					<Card
						href={`/collections/${item.collection.id}/item/${item.id}`}
						class="flex flex-row justify-between items-center p-1.5"
					>
						<Badge>
							<Icon />
							<span class="text-nowrap truncate"> {item.collection.name} </span>
						</Badge>

						<span class="grow text-base font-semibold text-nowrap truncate">{item.name}</span>

						<span class="text-xs shrink-0">
							{timeAgo(item.updatedAt)}
						</span>
					</Card>
				{/each}
			</div>
		</section>

		<section class="space-y-1">
			<div class="flex items-center justify-between px-2">
				<h2 class="text-base font-semibold">Templates</h2>

				<Button href="/templates" theme="ghost" variant="cicon">
					<ArrowRight />
				</Button>
			</div>

			<div class="w-full flex gap-x-2 overflow-x-auto hd-scroll">
				{#each data.templates as template (template.id)}
					{@const Icon = COLLECTION_ICONS[template.icon]}

					<Card href="/templates/{template.id}" class="min-w-36 lg:min-w-40 first:ml-2 last:mr-2">
						<div class={tm('size-8 p-1 rounded-lg', THEME_COLORS[Color.GRAY])}>
							<Icon class="size-6" />
						</div>
						<span class="grow text-sm font-semibold text-nowrap truncate"> {template.name} </span>
					</Card>
				{/each}
			</div>
		</section>
	{/if}
</PageContainer>
