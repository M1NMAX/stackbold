<script lang="ts">
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import PanelLeftOpen from 'lucide-svelte/icons/panel-left-open';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	import { aggregatePropertyValue, isPropertyVisible, tm } from '$lib/utils/index.js';
	import { type Item, PropertyType, type View } from '@prisma/client';
	import { getItemState, ItemMenu } from './index.js';
	import {
		PropertyValue,
		PropertyIcon,
		PropertyAggregatorMenu,
		getPropertyState
	} from '$lib/components/property';
	import { fade } from 'svelte/transition';
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		Label,
		MenuTitle,
		Switch
	} from '$lib/components/base/index.js';
	import {
		DEBOUNCE_INTERVAL,
		ITEMS_CHUNK_SIZE,
		MAX_ITEM_NAME_LENGTH,
		NO_ITEMS
	} from '$lib/constant/index.js';
	import type { RouterInputs } from '$lib/trpc/router';
	import debounce from 'debounce';
	import { getViewState } from '$lib/components/view/index.js';

	type Props = {
		view: View;
		items: Item[];
		clickOpenItem: (id: string) => void;
	};

	let { view, items, clickOpenItem }: Props = $props();
	let multiplier = $state(1);
	const renderLimit = $derived(ITEMS_CHUNK_SIZE * multiplier);
	const viewState = getViewState();
	const propertyState = getPropertyState();
	const itemState = getItemState();
	const properties = $derived(getVisibleProperties());

	const updItemDebounced = debounce(updItem, DEBOUNCE_INTERVAL);
	async function updItem(args: RouterInputs['items']['update']) {
		itemState.updItem(args);
	}

	async function togglePropertyVisibility(pid: string) {
		const properties = view.properties.map((p) =>
			p.id !== pid ? p : { ...p, isVisible: !p.isVisible }
		);
		await viewState.updView({ id: view.id, properties });
	}

	//TODO: validate value
	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;

		const id = targetEl.dataset.id!;
		const name = targetEl.value;
		updItemDebounced({ id, name });
	}

	function getVisibleProperties() {
		return propertyState.properties.filter((property) => isPropertyVisible(view, property.id));
	}
</script>

{#if items.length === 0}
	<p class="text-center">{NO_ITEMS}</p>
{:else}
	<div class="overflow-x-auto pb-1.5">
		<table class="w-full table-auto">
			<thead>
				<tr class="text-muted-foreground text-sm">
					<th scope="col" class="text-left rounded-t-md hover:bg-muted/90 py-2 px-4 cursor-pointer">
						<span class="flex items-center">
							<PropertyIcon key={PropertyType.TEXT} class="mr-2" />
							Name
						</span>
					</th>
					{#each properties as property (property.id)}
						<th
							scope="col"
							class="text-left text-nowrap rounded-t-md hover:bg-muted/90 py-2 px-4 md:px-2 cursor-pointer"
						>
							<span class="flex items-center">
								<PropertyIcon key={property.type} class="mr-2" />
								{property.name}
							</span>
						</th>
					{/each}

					<th scope="col" class="text-left w-8">
						{@render visibilityMenu()}
					</th>
				</tr>
			</thead>
			<tbody>
				{#each items.slice(0, renderLimit) as item (item.id)}
					<tr
						class={tm(
							'font-medium text-base whitespace-nowrap border-y border-secondary hover:bg-muted/40 group',
							item.id === itemState.active && 'border-r-2 border-r-primary bg-secondary/70'
						)}
					>
						<td class="flex items-center justify-between pl-2 pr-1">
							<input
								data-id={item.id}
								value={item.name}
								oninput={handleOnInput}
								maxlength={MAX_ITEM_NAME_LENGTH}
								class="grow py-1.5 px-1 focus:outline-none bg-inherit"
							/>

							<Button
								theme="secondary"
								variant="compact"
								onclick={() => clickOpenItem(item.id)}
								class="md:invisible md:group-hover:visible"
							>
								<PanelLeftOpen class="hidden md:block" />
								<span> Open </span>
							</Button>
						</td>

						{#each properties as property (property.id)}
							<td class="border last:border-r-0 px-2">
								<PropertyValue {view} {property} {item} />
							</td>
						{/each}
						<td class="px-1">
							<ItemMenu id={item.id} name={item.name} {clickOpenItem} align="start" />
						</td>
					</tr>
				{/each}
				{#if items.length > renderLimit}
					<tr>
						<td colspan={properties.length + 3}>
							<Button theme="ghost" variant="menu" onclick={() => (multiplier += 1)}>
								<ArrowDown />
								Load more
							</Button>
						</td>
					</tr>
				{/if}
				<tr>
					<td></td>

					{#each properties as property (property.id)}
						{@const calculated = property.aggregator
							? aggregatePropertyValue(property.aggregator, property, items, true)
							: ''}
						<td>
							<div class="flex w-full justify-end group">
								<PropertyAggregatorMenu
									{property}
									{calculated}
									onchange={(aggregator) => {
										propertyState.updProperty({ id: property.id, aggregator });
									}}
								/>
							</div>
						</td>
					{/each}

					<td></td>
				</tr>
			</tbody>
		</table>
	</div>
{/if}
{#snippet visibilityMenu()}
	<AdaptiveWrapper triggerClass={buttonVariants({ theme: 'ghost' })} floatingAlign="start">
		{#snippet trigger()}
			<ToggleRight />
		{/snippet}

		<MenuTitle title="Property visibility" />

		{#each propertyState.properties as property (property.id)}
			<Label for={property.id} compact hoverEffect>
				<PropertyIcon key={property.type} />
				<span> {property.name} </span>
				<Switch
					id={property.id}
					checked={isPropertyVisible(view, property.id)}
					onchange={() => togglePropertyVisibility(property.id)}
				/>
			</Label>
		{/each}
	</AdaptiveWrapper>
{/snippet}
