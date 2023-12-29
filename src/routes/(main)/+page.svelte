<script lang="ts">
	import type { PageData } from './$types';
	import type { Collection } from '@prisma/client';
	import { PageContent } from '$lib/components/page';
	import { icons } from '$lib/components/icon';
	import { ArrowRight } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { PROPERTY_COLORS } from '$lib/constant';
	import { Button } from '$lib/components/ui/button';
	import dayjs from '$lib/utils/dayjs';

	export let data: PageData;
	$: ({ user, collections, items } = data);

	$: updCollections = getUpdCollections(collections);

	$: innerWidth < 640 && (view = 'list');
	let view = 'grid';

	let innerWidth: number;

	function getUpdCollections(collections: Collection[]) {
		const sorted = collections.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

		//TODO: consider reducing the number of collections if above X
		return sorted;
	}
</script>

<svelte:head>
	<title>Dashboard - Stackbold</title>
</svelte:head>

<svelte:window bind:innerWidth />

<div class="grow p-1 rounded-md bg-card text-secondary-foreground">
	<PageContent class="space-y-5">
		<h1 class="font-semibold text-2xl">Welcome back, {user.name}!</h1>

		<section class="space-y-1.5">
			<h2 class="text-xl">Favourites Collections</h2>

			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
				{#each collections as collection (collection.id)}
					{#if collection.isFavourite}
						<a
							href="/collections/{collection.id}"
							class="w-full p-2 space-y-1.5 rounded border duration-300 transition-colors hover:bg-accent"
						>
							<div class="flex items-center space-x-2">
								<svelte:component this={icons[collection.icon]} class="icon-md" />
								<h2 class="grow text-xl truncate">{collection.name}</h2>
							</div>

							<div class="flex items-center space-x-2">
								{#each collection.properties as property}
									<span
										class={cn(
											'h-6 w-fit flex items-center rounded outline-none border-0 py-1 px-1.5 font-semibold ',
											PROPERTY_COLORS['GRAY']
										)}
									>
										{property.name}
									</span>
								{/each}
							</div>

							<div class="flex items-center space-x-2">
								<span>
									{items[collection.id]} Items
								</span>
								<span> Updated {dayjs(collection.updatedAt).fromNow()} </span>
							</div>
						</a>
					{/if}
				{/each}
			</div>
		</section>

		<section class="mt-10 space-y-1.5">
			<div class="flex items-centers justify-between">
				<h2 class="text-xl">Recently updated</h2>

				<Button href="/collections" variant="ghost" size="icon"><ArrowRight /></Button>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
				{#each updCollections as collection}
					<a
						href="/collections/{collection.id}"
						class="w-full p-2 space-y-1.5 rounded border transition-colors hover:bg-accent"
					>
						<div class="flex items-center space-x-2">
							<svelte:component this={icons[collection.icon]} class="icon-md" />
							<h2 class="grow text-xl truncate">{collection.name}</h2>
						</div>

						<div class="flex items-center space-x-2">
							{#each collection.properties as property}
								<span
									class={cn(
										'h-6 w-fit flex items-center rounded outline-none border-0 py-1 px-1.5 font-semibold ',
										PROPERTY_COLORS['GRAY']
									)}
								>
									{property.name}
								</span>
							{/each}
						</div>

						<div class="flex items-center space-x-2">
							<span>
								{items[collection.id]} Items
							</span>
							<span> Updated {dayjs(collection.updatedAt).fromNow()} </span>
						</div>
					</a>
				{/each}
			</div>
		</section>
	</PageContent>
</div>
