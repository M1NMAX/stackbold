<script lang="ts">
	import { type Property, type Item, View } from '@prisma/client';
	import { ItemsListView, ItemsTableView } from '.';

	type Props = {
		items: Item[];
		properties: Property[];
		view: View;

		clickOpenItem: (id: string) => void;
		renameItem: (id: string, name: string) => void;
		updPropertyVisibility: (pid: string, name: string, value: View[]) => void;

		//TODO: ref
		//forward
		clickDuplicateItem: (id: string) => void;
		clickDeleteItem: (id: string) => void;

		//forward too
		updPropertyValue: (itemId: string, property: { id: string; value: string }) => void;
	};

	let { items, properties, view, ...rest }: Props = $props();
</script>

{#if items.length > 0}
	<div class="grow space-y-2">
		{#if view === View.TABLE}
			<ItemsTableView {items} {properties} {...rest} />
		{:else}
			<ItemsListView {items} {properties} {...rest} />
		{/if}
	</div>
{/if}
