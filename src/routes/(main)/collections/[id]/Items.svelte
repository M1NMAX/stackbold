<script lang="ts">
	import { RadioButton } from '$lib/components';
	import { pluralize } from '$lib/utils';
	import {
		DotsHorizontalOutline,
		ListOutline,
		TableRowOutline,
		WindowOutline
	} from 'flowbite-svelte-icons';
	import type { CollectionProperty, Item as ItemType } from '@prisma/client';
	import Item from './Item.svelte';
	import { fade } from 'svelte/transition';
	import dayjs from '$lib/dayjs';
	import IconBtn from '$lib/components/IconBtn.svelte';

	export let items: ItemType[];
	export let collectionProperties: CollectionProperty[];
	export let view: string;
	export let currActiveItem: string | undefined = undefined;
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
		<table class="w-full">
			<thead>
				<tr class="text-gray-500 text-sm">
					<th scope="col" class="text-left rounded-t-md hover:bg-base-200 py-2 px-1">Name</th>
					{#each collectionProperties as property (property.id)}
						<th scope="col" class="text-left rounded-t-md hover:bg-base-200 py-2 px-1"
							>{property.name}</th
						>
					{/each}
					<th
						scope="col"
						class="whitespace-nowrap text-left rounded-t-md hover:bg-base-200 py-2 px-1"
					>
						Last updated
					</th>

					<th scope="col" class="text-left" title="Row actions">
						<DotsHorizontalOutline />
					</th>
				</tr>
			</thead>
			<tbody>
				{#if items.length}
					{#each items as item (item.id)}
						<tr class="font-medium text-base border-y-2 border-gray-100 hover:bg-base-200">
							<td class="text-left py-2 px-1"> {item.name}</td>

							{#each item.properties as property (property.id)}
								<td class="text-left py-2 px-1">
									{property.value}
								</td>
							{/each}
							<td class="whitespace-nowrap text-left py-2 px-1">
								{dayjs(item.updatedAt).fromNow()}
							</td>

							<td class="text-left whitespace-nowrap">
								<!-- <IconBtn>
									<WindowOutline class="rotate-90" />
								</IconBtn> -->

								<IconBtn>
									<DotsHorizontalOutline />
								</IconBtn>
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan={collectionProperties.length + 3}>
							<div class="empty" in:fade>
								<!-- <div class="empty-icon"><IconEmpty size="5em" /></div> -->
								No items found.
							</div>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	{:else}
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
	{/if}
</div>
