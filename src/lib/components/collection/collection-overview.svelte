<script lang="ts">
	import { icons } from '$lib/components/icon';
	import dayjs from '$lib/utils/dayjs';
	import { FileClock, Hash, Pin, PinOff } from 'lucide-svelte';
	import type { Collection } from '@prisma/client';

	type Props = {
		collection: Collection;
	};
	let { collection }: Props = $props();

	const Icon = $derived(icons[collection.icon]);
</script>

<a
	href="/collections/{collection.id}"
	data-testid="collection-overview"
	class="flex flex-col items-start p-1.5 space-y-2 rounded bg-secondary/40 hover:bg-secondary/60"
>
	<div class="w-full flex items-center justify-between space-x-2">
		<Icon class="icon-md" />
		<h2 class="grow text-base font-semibold text-nowrap truncate">
			{collection.name}
		</h2>
		<!--TODO: turn into btn  -->
		<!-- {#if collection.isPinned}
			<PinOff class="icon-xs" />
		{:else}
			<Pin class="icon-xs" />
		{/if} -->
	</div>

	<div class="flex items-center text-xs text-muted-foreground">
		<FileClock class="icon-xs mr-2 text-primary" />
		Updated {dayjs(collection.updatedAt).fromNow()}
	</div>
</a>
