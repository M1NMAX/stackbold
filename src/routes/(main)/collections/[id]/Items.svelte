<script lang="ts">
	import { RadioButton } from '$lib/components';
	import { pluralize } from '$lib/utils';
	import { ListOutline, TableRowOutline } from 'flowbite-svelte-icons';
	import type { CollectionProperty, Item as ItemType } from '@prisma/client';
	import Item from './Item.svelte';

	export let items: ItemType[];
	export let collectionProperties: CollectionProperty[];
	export let view: string;
	export let currActiveItem: string | undefined = undefined;
</script>

<div class="h-full p-1 space-y-1">
	<!-- View handler -->
	<div class="flex justify-between border-b-2">
		<div>
			<p class="text-lg font-medium">{pluralize('Item', items.length, 's')}</p>
		</div>

		<div class="inline-flex rounded shadow-sm bg-gray-100">
			<RadioButton value="list" bind:group={view}><ListOutline /></RadioButton>
			<RadioButton value="table" bind:group={view}><TableRowOutline /></RadioButton>
		</div>
	</div>

	<div class="h-full space-y-2 grow overflow-y-auto">
		{#each items as item}
			<Item
				{item}
				{collectionProperties}
				active={currActiveItem === item.id}
				on:clickOpenItem
				on:clickHideItem
				on:clickDuplicateItem
				on:clickDeleteItem
				on:updPropertyValue
			/>
		{/each}
	</div>
</div>
