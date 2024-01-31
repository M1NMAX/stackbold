<script lang="ts">
	import type { Collection } from '@prisma/client';
	import { icons } from '$lib/components/icon';
	import { cn } from '$lib/utils';
	import dayjs from '$lib/utils/dayjs';
	import { Hash, Heart } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import type { RouterOutputs } from '$lib/trpc/router';

	export let collection: RouterOutputs['collections']['list'][0];
</script>

<a
	href="/collections/{collection.id}"
	data-testid="collection-overview"
	class="flex flex-col items-start p-1.5 space-y-2 rounded bg-secondary/40 hover:bg-secondary/60"
>
	<div class="w-full flex items-center justify-between space-x-2">
		<svelte:component this={icons[collection.icon]} class="icon icon-md" />
		<h2 class="grow text-lg font-semibold">
			{collection.name}
		</h2>

		<Button variant="ghost" size="xs">
			<Heart class={cn('icon-xs', collection.isFavourite && 'fill-primary text-primary')} />
		</Button>
	</div>

	<div class="flex space-x-4 text-sm text-muted-foreground">
		<div class="flex items-center">
			<Hash class="icon-xxs mr-1 text-primary" />

			{collection.nItems > 0 ? collection.nItems + ' Items' : 'Empty'}
		</div>
		<div>
			Updated {dayjs(collection.updatedAt).fromNow()}
		</div>
	</div>
</a>
