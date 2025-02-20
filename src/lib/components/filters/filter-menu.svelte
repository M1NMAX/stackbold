<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Eraser from 'lucide-svelte/icons/eraser';
	import FilterIcon from 'lucide-svelte/icons/filter';
	import Minus from 'lucide-svelte/icons/minus';
	import X from 'lucide-svelte/icons/x';
	import {
		Accordion,
		AccordionItem,
		Button,
		buttonVariants,
		Checkbox,
		Drawer,
		Dropdown,
		HSeparator,
		Radio
	} from '$lib/components/base/index.js';
	import { getOption, getPropertyState, PropertyIcon } from '$lib/components/property';
	import { PROPERTY_COLORS } from '$lib/constant';
	import type { Filter, Property, PropertyType } from '@prisma/client';
	import { ModalState } from '$lib/states/index.js';
	import { isFilterSeletect, toggleFilter } from './helpers';
	import { MediaQuery } from 'svelte/reactivity';

	type Props = {
		filters: Filter[];
		updFilters: (filters: Filter[]) => void;
	};

	let { filters, updFilters }: Props = $props();

	const propertyState = getPropertyState();
	const detailViewState = new ModalState();
	const menuState = new ModalState();
	const isLargeScreen = new MediaQuery('min-width: 768px', false);

	let selectedProperty = $state(propertyState.properties[0]);

	function isSelected(id: string, value: string) {
		return isFilterSeletect(filters, { id, value });
	}

	function onClickFilterOption(id: string, value: string, type: PropertyType) {
		updFilters(
			toggleFilter(filters, {
				id,
				value,
				type
			})
		);
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

<div>
	<button onclick={() => menuState.toggle()} class={buttonVariants({ theme: 'secondary' })}>
		<FilterIcon class="block md:hidden" />
		<span class="hidden md:block"> Filters </span>
	</button>

	{#if isLargeScreen.current}
		<Dropdown bind:open={menuState.isOpen} alignEnd={true} onClose={() => detailViewState.close()}>
			{#if !detailViewState.isOpen}
				<p class="py-1.5 px-2 text-sm font-semibold">Filters</p>

				<HSeparator />

				{@render activeFilters()}

				{#each propertyState.properties as property}
					{#if property.type === 'CHECKBOX' || property.type === 'SELECT'}
						<Button
							theme="ghost"
							variant="menu"
							onclick={() => {
								selectedProperty = property;
								detailViewState.open();
							}}
						>
							<PropertyIcon key={property.type} class="mr-0" />
							{property.name}
						</Button>
					{/if}
				{/each}
			{:else}
				{@render header()}
				<div class="w-full px-1 pb-1">
					{@render content(selectedProperty)}
				</div>
				{@render clearBtn(selectedProperty.id)}
			{/if}
		</Dropdown>
	{:else}
		<Drawer bind:open={menuState.isOpen}>
			<span class="flex items-center gap-x-2">
				<span class="p-1.5 rounded-md bg-secondary">
					<FilterIcon class="size-5" />
				</span>
				<span class="text-left">Filters</span>
			</span>

			{@render activeFilters()}

			<Accordion type="single" class="pt-2">
				{#each propertyState.properties as property}
					{#if property.type === 'CHECKBOX' || property.type === 'SELECT'}
						<AccordionItem arrow={false}>
							{#snippet header()}
								<PropertyIcon key={property.type} class="size-4 mr-0" />
								{property.name}
							{/snippet}
							<div class="px-0">
								{@render content(property)}
							</div>
						</AccordionItem>
					{/if}
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
				{@const property = propertyState.getProperty(filter.id)}

				{#if property}
					{#if property.type === 'CHECKBOX'}
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
					{:else if property.type === 'SELECT'}
						{#each filter.values as vl}
							{@const option = getOption(property.options, vl)}
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
	{#if property.type === 'CHECKBOX'}
		{#each [true, false] as value}
			<Radio
				name={property.name}
				checked={isSelected(property.id, value.toString())}
				onclick={() => onClickFilterOption(property.id, value.toString(), property.type)}
			>
				{@render mockCheckbox(value)}
				<span class="grow font-semibold"> {value ? 'Checked' : 'Unchecked'} </span>
			</Radio>
		{/each}
	{:else if property.type === 'SELECT'}
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
