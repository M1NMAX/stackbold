<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Property, Item, Aggregador } from '@prisma/client';
	import { getActiveItemState, ItemMenu } from '.';
	import {
		PropertyValue,
		// helpers
		getPropertyColor,
		getPropertyRef,
		getPropertyValue
	} from '$lib/components/property';
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import { PanelLeftOpen, Settings2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { getScreenState } from '$lib/components/view';

	export let items: Item[];
	export let properties: Property[];

	const activeItem = getActiveItemState();

	const isDesktop = getScreenState();

	const dispatch = createEventDispatcher<{
		clickOpenItem: string;
		updPropertyVisibility: { pid: string; name: string; value: boolean };
		renameItem: { id: string; name: string };
	}>();

	//TODO: validate inner text
	function handleOnInput(e: { currentTarget: EventTarget & HTMLDivElement }) {
		const targetEl = e.currentTarget;

		const id = targetEl.dataset.id!;
		const name = targetEl.innerText;
		dispatch('renameItem', { id, name });
	}

	function preventEnterKeypress(e: KeyboardEvent) {
		if (e.key === 'Enter') e.preventDefault();
	}

	function aggregatePropertyValue(property: Property, type: Aggregador) {
		if (type === 'COUNT') return items.length;
		if (type === 'COUNT_EMPTY') {
			return items.reduce((acc, item) => {
				const propertyRef = getPropertyRef(item.properties, property.id);
				if (propertyRef == null || propertyRef.value === '') return acc + 1;
				return acc;
			}, 0);
		}
		if (type === 'COUNT_NOT_EMPTY') {
			return items.reduce((acc, item) => {
				const propertyRef = getPropertyRef(item.properties, property.id);
				if (propertyRef && propertyRef.value !== '') return acc + 1;
				return acc;
			}, 0);
		}
		if (type === 'SUM' || type === 'AVG') {
			const sum = items.reduce((acc, curr) => {
				const propertyRef = getPropertyRef(curr.properties, property.id);
				const inc = propertyRef ? getPropertyValue(property, propertyRef.value) : 0;
				return acc + Number(inc);
			}, 0);
			if (type === 'SUM') return sum;
			return (sum / items.length).toFixed(2);
		}
	}
</script>

<div class="overflow-x-auto">
	<table class="w-full table-auto">
		<thead>
			<tr class="text-muted-foreground text-sm">
				<th scope="col" class="text-left rounded-t-md hover:bg-muted/90 py-2 px-1 cursor-pointer">
					Name
				</th>
				{#each properties as property (property.id)}
					{#if property.isVisibleOnTableView}
						<th
							scope="col"
							class="text-left rounded-t-md hover:bg-muted/90 py-2 px-1 cursor-pointer"
						>
							{property.name}
						</th>
					{/if}
				{/each}

				<th scope="col" class="text-left" title="Row actions">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild let:builder>
							<Button variant="ghost" size="xs" builders={[builder]}>
								<Settings2 class="icon-xs" />
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-56">
							<DropdownMenu.Label>Toggle property visibility</DropdownMenu.Label>
							<DropdownMenu.Separator />

							{#each properties as property (property.id)}
								<DropdownMenu.CheckboxItem
									checked={property.isVisibleOnTableView}
									on:click={() => {
										dispatch('updPropertyVisibility', {
											pid: property.id,
											name: 'isVisibleOnTableView',
											value: !property.isVisibleOnTableView
										});
									}}
								>
									{property.name}
								</DropdownMenu.CheckboxItem>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</th>
			</tr>
		</thead>
		<tbody>
			{#if items.length === 0}
				<tr>
					<td colspan={properties.length + 3}>
						<div class="empty" in:fade>
							<!-- <div class="empty-icon"><IconEmpty size="5em" /></div> -->
							No items found.
						</div>
					</td>
				</tr>
			{/if}
			{#if items.length > 1}
				{#each items as item (item.id)}
					<tr
						class={cn(
							'font-medium text-base whitespace-nowrap w-96 border-y  border-secondary  hover:bg-opacity-20  group  ',
							item.id === $activeItem?.id && 'bg-card/50 border-r-2 border-y-0  border-primary'
						)}
					>
						<td class="flex items-center justify-between">
							<!-- svelte-ignore a11y-no-static-element-interactions -->
							<div
								contenteditable
								spellcheck={false}
								on:keypress={preventEnterKeypress}
								on:input={handleOnInput}
								data-id={item.id}
								class=" text-left py-2 px-1 focus:outline-none"
							>
								{item.name}
							</div>

							<Button
								variant="secondary"
								size="sm"
								on:click={() => dispatch('clickOpenItem', item.id)}
								class={cn(
									'items-center space-x-2 py-0.5 px-1 rounded',
									$isDesktop && ' invisible group-hover:visible'
								)}
							>
								<span> Open </span>

								<PanelLeftOpen class="icon-xs" />
							</Button>
						</td>

						{#each properties as property (property.id)}
							{@const propertyRef = getPropertyRef(item.properties, property.id)}
							{#if property.isVisibleOnTableView && propertyRef}
								{@const color = getPropertyColor(property, propertyRef.value)}
								{@const value = getPropertyValue(property, propertyRef.value, false)}

								<td class="border">
									{#if propertyRef}
										<PropertyValue
											isTableView
											{property}
											{color}
											{value}
											itemId={item.id}
											on:updPropertyValue
										/>
									{/if}
								</td>
							{/if}
						{/each}

						<td>
							<ItemMenu itemId={item.id} on:clickDuplicateItem on:clickDeleteItem />
						</td>
					</tr>
				{/each}
				<tr>
					<td />
					{#each properties as property (property.id)}
						{#if property.isVisibleOnTableView}
							{#if property.aggregador === 'NONE'}
								<td />
							{:else}
								<td class="text-right px-2">
									<span class="text-[0.65rem] font-medium"> {property.aggregador}</span>
									<span class="font-semibold">
										{aggregatePropertyValue(property, property.aggregador)}
									</span>
								</td>
							{/if}
						{/if}
					{/each}
				</tr>
			{/if}
		</tbody>
	</table>
</div>
