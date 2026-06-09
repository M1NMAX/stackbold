<script lang="ts">
	import { COLLECTION_ICONS } from '$lib/constant/index.js';
	import { getCollectionView } from './index.js';
	import type { CollectionWithViews } from '$lib/types';
	import { pluralize } from '$lib/utils/index.js';
	import { Card } from '$lib/components/base/index.js';

	type Props = {
		collection: CollectionWithViews;
	};

	let { collection }: Props = $props();

	const Icon = $derived(COLLECTION_ICONS[collection.icon]);
	const items = $derived(collection._count.items);
</script>

<Card
	href="/collections/{collection.id}?view={getCollectionView(collection)}"
	class="flex flex-row items-center"
>
	<Icon class="size-6" />
	<div class="grow flex flex-col">
		<h2 class="grow text-sm font-semibold text-nowrap truncate">
			{collection.name}
		</h2>

		<span class="text-xs text-muted-foreground">
			{items === 0 ? 'Empty' : pluralize(items, 'item', 's')}
		</span>
	</div>
</Card>
