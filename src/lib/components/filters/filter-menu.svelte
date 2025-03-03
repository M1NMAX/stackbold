<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Popover from '$lib/components/ui/popover';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Drawer from '$lib/components/ui/drawer';
	import { getOption, getPropertyState, PropertyIcon } from '$lib/components/property';
	import { Check, Filter as FilterIcon, X, Minus, ChevronLeft, Eraser } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { PROPERTY_COLORS } from '$lib/constant';
	import type { Filter, PropertyType } from '@prisma/client';
	import { ModalState } from '$lib/components/modal';
	import { isFilterSeletect, toggleFilter } from './helpers';
	import { Separator } from '$lib/components/ui/separator';

	type Props = {
		filters: Filter[];
		updFilters: (filters: Filter[]) => void;
	};

	let { filters, updFilters }: Props = $props();

	const propertyState = getPropertyState();
	const detailViewState = new ModalState();

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

<Popover.Root
	onOpenChange={(value) => {
		if (value) detailViewState.close();
	}}
>
	<Popover.Trigger class={buttonVariants({ variant: 'secondary', className: 'hidden md:block' })}>
		Filters
	</Popover.Trigger>
	<Popover.Content class="w-auto max-w-xs flex flex-col items-center justify-start space-y-1 p-0">
		{#if !detailViewState.isOpen}
			<div class="w-full p-1">
				<div class="w-full px-1.5 py-1 text-sm font-semibold">Filters</div>
			</div>
			<Separator />

			{@render activeFilters()}

			<div class="min-w-84 p-1">
				{#each propertyState.properties as property}
					{#if property.type === 'CHECKBOX' || property.type === 'SELECT'}
						<Button
							variant="ghost"
							class="h-8 w-full justify-start gap-0"
							onclick={() => {
								selectedProperty = property;
								detailViewState.open();
							}}
						>
							<PropertyIcon key={property.type} />
							{property.name}
						</Button>
					{/if}
				{/each}
			</div>
		{:else}
			{@render header()}
			<div class="w-full px-1 pb-1">
				{@render content()}
			</div>
			{@render clearBtn(selectedProperty.id)}
		{/if}
	</Popover.Content>
</Popover.Root>
<Drawer.Root>
	<Drawer.Trigger
		class={buttonVariants({ variant: 'secondary', size: 'icon', className: 'md:hidden' })}
	>
		<FilterIcon />
	</Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Header class="pt-2 pb-0">
			<span class="flex items-center gap-x-2">
				<span class="p-1.5 rounded-md bg-secondary">
					<FilterIcon class="icon-sm" />
				</span>
				<Drawer.Title class="text-left">Filters</Drawer.Title>
			</span>
		</Drawer.Header>
		<Drawer.Footer class="pt-2 pb-0 px-0">
			{@render activeFilters()}
			<Accordion.Root
				type="single"
				class="w-full sm:max-w-[70%]"
				onValueChange={(value) => {
					const property = propertyState.getProperty(value);
					if (!property) return;
					selectedProperty = property;
					detailViewState.open();
				}}
			>
				{#each propertyState.properties as property}
					{#if property.type === 'CHECKBOX' || property.type === 'SELECT'}
						<Accordion.Item value={property.id}>
							<Accordion.Trigger
								class="justify-start space-x-2 px-4 py-1 font-semibold rounded-sm hover:no-underline hover:bg-muted"
								showArrow={false}
							>
								<PropertyIcon key={property.type} />
								{property.name}
							</Accordion.Trigger>
							<Accordion.Content>
								<div class="px-0">
									{@render content(true)}
								</div>
							</Accordion.Content>
						</Accordion.Item>
					{/if}
				{/each}
			</Accordion.Root>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>

{#snippet header()}
	<div class="w-full flex items-center gap-x-0.5 px-1 pt-1">
		<Button variant="ghost" size="xs" onclick={() => detailViewState.close()}>
			<ChevronLeft />
		</Button>
		<span class="pl-0.5 pr-2.5 py-1 font-semibold text-sm">
			{selectedProperty.name}
			<strong> is </strong>
		</span>
	</div>
	<Separator />
{/snippet}

{#snippet content(insideDrawer: boolean = false)}
	{@const baseStyle =
		'w-full flex items-center gap-x-1.5 rounded-sm cursor-pointer hover:bg-secondary hover:text-secondary-accent'}
	{@const padding = insideDrawer ? 'py-1 px-5' : 'py-1.5 px-2'}
	{#if selectedProperty.type === 'CHECKBOX'}
		<RadioGroup.Root class="w-full gap-y-0">
			<Label for={`${selectedProperty.id}-filter-true`} class={cn(baseStyle, padding)}>
				{@render mockCheckbox(true)}
				<span class="grow text-sm font-semibold pr-10"> Checked </span>

				<Check
					class={cn('icon-xs', !isSelected(selectedProperty.id, 'true') && 'text-transparent')}
				/>
				<RadioGroup.Item
					value="true"
					id={`${selectedProperty.id}-filter-true`}
					class="sr-only"
					onclick={() => onClickFilterOption(selectedProperty.id, 'true', selectedProperty.type)}
				/>
			</Label>
			<Label for={`${selectedProperty.id}-filter-false`} class={cn(baseStyle, padding)}>
				{@render mockCheckbox(false)}
				<span class="grow text-sm font-semibold pr-10"> Unchecked </span>

				<Check
					class={cn('icon-xs', !isSelected(selectedProperty.id, 'false') && 'text-transparent')}
				/>

				<RadioGroup.Item
					value="false"
					id={`${selectedProperty.id}-filter-false`}
					class="sr-only"
					onclick={() => onClickFilterOption(selectedProperty.id, 'false', selectedProperty.type)}
				/>
			</Label>
		</RadioGroup.Root>
	{:else if selectedProperty.type === 'SELECT'}
		<RadioGroup.Root class="w-full gap-y-0">
			{#each selectedProperty.options as option}
				<Label for={`${selectedProperty.id}-filter-${option.id}`} class={cn(baseStyle, padding)}>
					<span class={cn('size-3.5 rounded-sm', PROPERTY_COLORS[option.color])}></span>

					<span class="grow text-sm font-semibold pr-10">
						{option.value}
					</span>

					<Check
						class={cn('icon-xs', !isSelected(selectedProperty.id, option.id) && 'text-transparent')}
					/>
					<RadioGroup.Item
						value="false"
						id={`${selectedProperty.id}-filter-${option.id}`}
						class="sr-only"
						onclick={() =>
							onClickFilterOption(selectedProperty.id, option.id, selectedProperty.type)}
					/>
				</Label>
			{/each}
		</RadioGroup.Root>
	{/if}
{/snippet}

{#snippet clearBtn(id: string)}
	{#if hasValues(id)}
		<Separator />
		<div class="w-full px-1 pb-1">
			<Button variant="ghost" class="h-8 w-full justify-start" onclick={() => clearFilter(id)}>
				<Eraser />
				Clear
			</Button>
		</div>
	{/if}
{/snippet}

{#snippet activeFilters()}
	{@const bg = 'h-7 flex items-center gap-x-1 py-0.5 px-1 rounded-sm'}
	{#if filters.length > 0}
		<p class="w-full text-xs font-semibold px-2 py-0.5">Active filters</p>
		<div class="w-full flex flex-wrap gap-1 px-2 pb-0.5">
			{#each filters as filter}
				{@const property = propertyState.getProperty(filter.id)}

				{#if property}
					{#if property.type === 'CHECKBOX'}
						{@const value = filter.values[0]}
						<Button class={cn(bg, PROPERTY_COLORS['GRAY'])} onclick={() => clearFilter(filter.id)}>
							{@render mockCheckbox(value === 'true')}
							<span class="text-sm font-semibold"> {property.name} </span>
							<X class="icon-xs" />
						</Button>
					{:else if property.type === 'SELECT'}
						{#each filter.values as vl}
							{@const option = getOption(property.options, vl)}
							{#if option}
								<Button
									class={cn(bg, PROPERTY_COLORS['GRAY'])}
									onclick={() => {
										onClickFilterOption(filter.id, option.id, property.type);
									}}
								>
									<span class={cn('size-3.5 rounded-sm', PROPERTY_COLORS[option.color])}></span>
									<span class="text-sm font-semibold">
										{option?.value}
									</span>
									<X class="icon-xs" />
								</Button>
							{/if}
						{/each}
					{/if}
				{/if}
			{/each}

			<Button class={cn('font-semibold', bg, PROPERTY_COLORS['GRAY'])} onclick={() => clearAll()}>
				Clear all
			</Button>
		</div>

		<Separator />
	{/if}
{/snippet}

{#snippet mockCheckbox(value: boolean)}
	<span class="p-[1px] rounded-sm bg-primary">
		{#if value}
			<Check class="icon-xxs " />
		{:else}
			<Minus class="icon-xxs " />
		{/if}
	</span>
{/snippet}
