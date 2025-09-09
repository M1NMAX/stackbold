<script lang="ts">
	import { type Item, type View, ViewType } from '@prisma/client';
	import { ItemsListView, ItemsTableView } from './index.js';

	type Props = {
		view: View;
		items: Item[];
		clickOpenItem: (id: string) => void;
	};

	let { view, items, ...rest }: Props = $props();
</script>

{#if items.length > 0}
	<div class="grow space-y-2">
		{#if view.type === ViewType.TABLE}
			<ItemsTableView {view} {items} {...rest} />
		{:else}
			<ItemsListView {view} {items} {...rest} />
		{/if}
	</div>
{/if}
