<script lang="ts">
	import type { Property, Item } from '@prisma/client';
	import { ItemsListView, ItemsTableView } from '.';

	export let items: Item[];
	export let properties: Property[];
	export let view: string;
</script>

{#if items.length > 0}
	<div class="grow space-y-2">
		{#if view === 'table'}
			<ItemsTableView
				{items}
				{properties}
				on:clickOpenItem
				on:clickRenameItem
				on:clickDuplicateItem
				on:clickDeleteItem
				on:updPropertyValue
				on:updPropertyVisibility
			/>
		{:else}
			<ItemsListView
				{items}
				{properties}
				on:clickOpenItem
				on:clickRenameItem
				on:clickDuplicateItem
				on:clickDeleteItem
				on:updPropertyValue
			/>
		{/if}
	</div>
{/if}
