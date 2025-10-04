<script lang="ts">
	import dayjs from '$lib/utils/dayjs';
	import FileClock from 'lucide-svelte/icons/file-clock';
	import { COLLECTION_ICONS } from '$lib/constant/index.js';
	import { getCollectionView } from './index.js';
	import type { CollectionWithViews } from '$lib/types';

	type Props = {
		collection: CollectionWithViews;
	};

	let { collection }: Props = $props();

	const Icon = $derived(COLLECTION_ICONS[collection.icon]);
</script>

<a
	href="/collections/{collection.id}?view={getCollectionView(collection)}"
	data-testid="collection-overview"
	class="flex flex-col items-start p-1 space-y-2 rounded bg-secondary bg-opacity-80 dark:bg-opacity-40 hover:bg-secondary/40 dark:hover:bg-secondary/60"
>
	<div class="w-full flex items-center justify-between space-x-2">
		<Icon class="size-6" />
		<h2 class="grow text-base font-semibold text-nowrap truncate">
			{collection.name}
		</h2>
	</div>

	<div class="flex items-center text-xs text-muted-foreground">
		<FileClock class="size-4 mr-2 text-primary" />
		Updated {dayjs(collection.updatedAt).fromNow()}
	</div>
</a>
