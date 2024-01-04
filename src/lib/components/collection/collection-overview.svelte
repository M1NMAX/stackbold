<script lang="ts">
	import type { Collection } from '@prisma/client';
	import { icons } from '$lib/components/icon';
	import { cn } from '$lib/utils';
	import dayjs from '$lib/utils/dayjs';
	import { Circle, Hash } from 'lucide-svelte';

	export let collection: Collection;
	export let nItems: number;
	export let view = 'view';
</script>

<a
	href="/collections/{collection.id}"
	class="flex flex-col items-start py-1 px-2 space-y-2 rounded bg-secondary/40 hover:bg-secondary/60"
>
	<div class="flex items-center justify-between space-x-2">
		<svelte:component this={icons[collection.icon]} class="icon icon-md" />
		<h2 class="text-lg font-semibold">
			{collection.name}
		</h2>
	</div>

	<div class="flex items-center space-x-2">
		{#each collection.properties as property}
			<span
				class="h-6 w-fit flex items-center rounded outline-none border-0 py-1 px-1.5 font-semibold bg-primary/70 text-primary-foreground"
			>
				{property.name}
			</span>
		{/each}
	</div>

	<div class="flex space-x-4 text-sm text-muted-foreground">
		<div class="flex items-center">
			<Hash class="icon-xxs mr-1 text-primary" />

			{nItems > 0 ? nItems + ' Items' : 'Empty'}
		</div>
		<div>
			Updated {dayjs(collection.updatedAt).fromNow()}
		</div>
	</div>

	{#if collection.description && view === 'list'}
		<p class="text-ellipsis font-normal text-gray-700 dark:text-gray-400 leading-tight">
			{collection.description.slice(0, 186).concat('...')}
		</p>
	{/if}
</a>
