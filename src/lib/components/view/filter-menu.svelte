<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Eraser from 'lucide-svelte/icons/eraser';
	import ListFilter from 'lucide-svelte/icons/list-filter';
	import Minus from 'lucide-svelte/icons/minus';
	import X from 'lucide-svelte/icons/x';
	import {
		Accordion,
		AccordionItem,
		Button,
		buttonVariants,
		Checkbox,
		Drawer,
		Floating,
		HSeparator,
		MenuTitle,
		RadioGroup,
		RadioGroupItem,
		Label,
		Tooltip
	} from '$lib/components/base/index.js';
	import { getOption, getPropertyState, PropertyIcon } from '$lib/components/property';
	import { PROPERTY_COLORS, FILTERABLE_PROPERTY_TYPES } from '$lib/constant';
	import { type Filter, type Property, PropertyType } from '@prisma/client';
	import { ModalState } from '$lib/states/index.js';
	import { isFilterSeletect, toggleFilter } from './index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import { useId } from '$lib/utils';

	type Props = {
		filters: Filter[];
		updFilters: (filters: Filter[]) => void;
	};

	let { filters, updFilters }: Props = $props();

	const id = useId('collection-filters');
	const propertyState = getPropertyState();
	const detailViewState = new ModalState();
	const menuState = new ModalState();
	const isLargeScreen = new MediaQuery('min-width: 768px', false);

	let properties = $derived.by(() =>
		propertyState.properties.filter((prop) => FILTERABLE_PROPERTY_TYPES.includes(prop.type))
	);
	// svelte-ignore state_referenced_locally
	let selectedProperty = $state(properties[0]);

	function isSelected(id: string, value: string) {
		return isFilterSeletect(filters, { id, value });
	}

	function getProperty(id: string) {
		return properties.find((property) => property.id === id);
	}

	function getValue(id: string) {
		const target = filters.find((f) => f.id == id);
		if (!target) return undefined;
		return target.values.length == 1 ? target.values[0] : undefined;
	}

	function onClickFilterOption(id: string, value: string, type: PropertyType) {
		updFilters(toggleFilter(filters, { id, value, type }));
	}

	function hasValues(id: string) {
		const target = filters.find((filter) => filter.id === id);
		if (!target) return false;
		return target.values.length > 0;
	}

	function clearFilter(id: string) {
		updFilters(filters.filter((filter) => filter.id !== id));
	}

	function clearAll() {
		updFilters([]);
	}
</script>

<Tooltip triggerBy={id} align="end">
	<span class="text-sm font-semibold py-1 px-1.5">Filter</span>
</Tooltip>
<div>
	<button
		{id}
		onclick={() => menuState.toggle()}
		type="button"
		class={buttonVariants({ theme: 'secondary', variant: 'icon' })}
	>
		<ListFilter />
	</button>

	{#if isLargeScreen.current}
		<Floating triggerBy={id} bind:visible={menuState.isOpen} align="end">
			{#if !detailViewState.isOpen}
				<MenuTitle title="Filters" />

				{@render activeFilters()}

				{#each properties as property}
					<Button
						theme="ghost"
						variant="menu"
						onclick={() => {
							selectedProperty = property;
							detailViewState.open();
						}}
					>
						<PropertyIcon key={property.type} />
						{property.name}
					</Button>
				{/each}
			{:else}
				{@render header()}
				<div class="w-full px-1 pb-1">
					{@render content(selectedProperty)}
				</div>
				{@render clearBtn(selectedProperty.id)}
			{/if}
		</Floating>
	{:else}
		<Drawer bind:open={menuState.isOpen}>
			<MenuTitle title="Filters" />

			{@render activeFilters()}

			<Accordion>
				{#each properties as property}
					<AccordionItem arrow={false}>
						{#snippet header()}
							<PropertyIcon key={property.type} class="size-4 mr-0" />
							{property.name}
						{/snippet}
						<div class="px-0">
							{@render content(property)}
						</div>
					</AccordionItem>
				{/each}
			</Accordion>
		</Drawer>
	{/if}
</div>

{#snippet activeFilters()}
	{#if filters.length > 0}
		<p class="w-full text-xs font-semibold px-2 py-0.5">Active filters</p>
		<div class="w-full flex flex-wrap gap-1 px-2 pb-0.5">
			{#each filters as filter}
				{@const property = getProperty(filter.id)}

				{#if property}
					{#if property.type === PropertyType.CHECKBOX}
						{@const value = filter.values[0]}
						<Button
							theme="secondary"
							variant="compact"
							class="font-semibold"
							onclick={() => clearFilter(filter.id)}
						>
							{@render mockCheckbox(value === 'true')}
							<span> {property.name} </span>
							<X />
						</Button>
					{:else}
						{#each filter.values as fv}
							{@const option = getOption(property.options, fv)}
							{#if option}
								<Button
									theme="secondary"
									variant="compact"
									class="font-semibold"
									onclick={() => onClickFilterOption(filter.id, option.id, property.type)}
								>
									<span class={['size-3.5 rounded-sm', PROPERTY_COLORS[option.color]]}></span>
									<span>
										{option.value}
									</span>
									<X />
								</Button>
							{/if}
						{/each}
					{/if}
				{/if}
			{/each}

			<Button theme="secondary" variant="compact" class="font-semibold" onclick={() => clearAll()}>
				Clear all
			</Button>
		</div>

		<HSeparator />
	{/if}
{/snippet}

{#snippet header()}
	<div class="w-full flex items-center gap-x-0.5 px-1 pt-1">
		<Button theme="ghost" variant="compact" onclick={() => detailViewState.close()}>
			<ChevronLeft />
		</Button>
		<span class="pl-0.5 pr-2.5 py-1 font-semibold text-sm">
			{selectedProperty.name}
			<strong> is </strong>
		</span>
	</div>
	<HSeparator />
{/snippet}

{#snippet content(property: Property)}
	{#if property.type === PropertyType.CHECKBOX}
		{@const currValue = getValue(property.id)}
		{#key currValue}
			<RadioGroup
				value={currValue}
				onchange={(value) => onClickFilterOption(property.id, value, property.type)}
			>
				{#each [true, false] as value}
					{@const filterMenuCheckboxId = useId('filter-menu-checkbox')}
					<Label for={filterMenuCheckboxId} compact hoverEffect>
						{@render mockCheckbox(value)}
						<span class="grow font-semibold"> {value ? 'Checked' : 'Unchecked'} </span>

						<RadioGroupItem id={filterMenuCheckboxId} value={value.toString()}></RadioGroupItem>
					</Label>
				{/each}
			</RadioGroup>
		{/key}
	{:else}
		{#each property.options as option}
			<Checkbox
				checked={isSelected(property.id, option.id)}
				onclick={() => onClickFilterOption(property.id, option.id, property.type)}
			>
				<span class={['size-3.5 rounded-sm', PROPERTY_COLORS[option.color]]}></span>

				<span class="grow font-semibold">
					{option.value}
				</span>
			</Checkbox>
		{/each}
	{/if}
{/snippet}

{#snippet clearBtn(id: string)}
	{#if hasValues(id)}
		<HSeparator />
		<div class="w-full px-1 pb-1">
			<Button theme="ghost" class="h-8 w-full justify-start" onclick={() => clearFilter(id)}>
				<Eraser />
				Clear
			</Button>
		</div>
	{/if}
{/snippet}

{#snippet mockCheckbox(value: boolean)}
	<span class="p-[1px] rounded-sm bg-primary">
		{#if value}
			<Check class="size-3" />
		{:else}
			<Minus class="size-3" />
		{/if}
	</span>
{/snippet}
