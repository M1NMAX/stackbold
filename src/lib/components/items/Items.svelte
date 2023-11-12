<script lang="ts">
	import { ItemsListView, ItemsTableView, RadioButton } from '$lib/components';
	import { pluralize } from '$lib/utils';
	import sortFun, { type IBaseSchema, type OrderType } from '$lib/utils/sort';
	import { ListOutline, TableRowOutline } from 'flowbite-svelte-icons';
	import type { CollectionProperty, Item as ItemType } from '@prisma/client';

	export let items: ItemType[];
	export let currActiveItemId: string | undefined = undefined;
	export let collectionProperties: CollectionProperty[];
	export let view: string;

	let field: keyof IBaseSchema = 'name';
	let order: OrderType = 'asc';

	$: sortedItems = items.sort(sortFun(field, order));
</script>

<div class="h-full p-1 space-y-1">
	<!-- View handler -->
	<div class="flex justify-between">
		<div>
			<p class="text-lg font-medium">{pluralize('Item', items.length, 's')}</p>
		</div>

		<div class="inline-flex rounded shadow-sm bg-gray-100">
			<RadioButton value="list" bind:group={view}><ListOutline /></RadioButton>
			<RadioButton value="table" bind:group={view}><TableRowOutline /></RadioButton>
		</div>
	</div>

	{#if view === 'table'}
		<ItemsTableView
			items={sortedItems}
			{currActiveItemId}
			{collectionProperties}
			bind:order
			onClickTableHead={(field) => {
				(field = field), (order = order === 'asc' ? 'desc' : 'asc');
			}}
			on:clickOpenItem
			on:clickHideItem
			on:clickDuplicateItem
			on:clickDeleteItem
			on:updPropertyValue
		/>
	{:else}
		<ItemsListView
			items={sortedItems}
			{currActiveItemId}
			{collectionProperties}
			on:clickOpenItem
			on:clickHideItem
			on:clickDuplicateItem
			on:clickDeleteItem
			on:updPropertyValue
		/>
	{/if}
</div>
