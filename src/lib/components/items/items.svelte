<script lang="ts">
	import { type Item, View } from '@prisma/client';
	import { ItemsListView, ItemsTableView } from '.';

	type Props = {
		items: Item[];
		view: View;

		clickOpenItem: (id: string) => void;
	};

	let { items, view, ...rest }: Props = $props();
</script>

{#if items.length > 0}
	<div class="grow space-y-2">
		{#if view === View.TABLE}
			<ItemsTableView {items} {...rest} />
		{:else}
			<ItemsListView {items} {...rest} />
		{/if}
	</div>
{/if}
