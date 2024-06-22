<script lang="ts">
	import { type Property, type Item, View } from '@prisma/client';
	import { ItemsListView, ItemsTableView } from '.';

	export let items: Item[];
	export let properties: Property[];
	export let view: View;
</script>

{#if items.length > 0}
	<div class="grow space-y-2">
		{#if view === View.TABLE}
			<ItemsTableView
				{items}
				{properties}
				on:clickOpenItem
				on:clickDuplicateItem
				on:clickDeleteItem
				on:renameItem
				on:updPropertyValue
				on:updPropertyVisibility
			/>
		{:else}
			<ItemsListView
				{items}
				{properties}
				on:clickOpenItem
				on:clickDuplicateItem
				on:clickDeleteItem
				on:renameItem
				on:updPropertyValue
			/>
		{/if}
	</div>
{/if}
