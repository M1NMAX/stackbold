<script lang="ts">
	import type { Collection } from '@prisma/client';
	import dayjs from '$lib/utils/dayjs';
	import FileClock from 'lucide-svelte/icons/file-clock';
	import { COLLECTION_ICONS, DEFAULT_VIEW_SHORT_ID } from '$lib/constant/index.js';

	type Props = {
		collection: Collection;
	};

	let { collection }: Props = $props();

	const Icon = $derived(COLLECTION_ICONS[collection.icon]);

	function getCollectionView() {
		if (typeof window === 'undefined') return DEFAULT_VIEW_SHORT_ID.toString();
		const key = `collection-${collection.id}-view`;
		const stored = localStorage.getItem(key);
		return stored ? JSON.parse(stored) : DEFAULT_VIEW_SHORT_ID.toString();
	}
</script>

<a
	href="/collections/{collection.id}?view={getCollectionView()}"
	data-testid="collection-overview"
	class="flex flex-col items-start p-1.5 space-y-2 rounded bg-secondary bg-opacity-80 dark:bg-opacity-40 hover:bg-secondary/40 dark:hover:bg-secondary/60"
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
