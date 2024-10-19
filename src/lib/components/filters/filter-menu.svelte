<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Popover from '$lib/components/ui/popover';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Drawer from '$lib/components/ui/drawer';
	import { getOption, getPropertyState, PropertyIcon } from '$lib/components/property';
	import { Check, Filter as FilterIcon, X, Minus } from 'lucide-svelte';
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
	<Popover.Trigger asChild let:builder>
		<Button builders={[builder]} variant="secondary" class="hidden md:block">Filters</Button>
	</Popover.Trigger>
	<Popover.Content
		class="w-auto min-w-60 max-w-lg flex flex-col items-center justify-start space-y-1"
	>
		{#if !detailViewState.isOpen}
			<p class="w-full px-2 py-1.5 text-sm font-semibold">Filters</p>
			<Separator />

			{@render activeFilters()}

			<p class="w-full text-xs font-semibold px-2 py-0.5">Add filter</p>
			{#each propertyState.properties as property}
				{#if property.type === 'CHECKBOX' || property.type === 'SELECT'}
					<Button
						variant="ghost"
						class="h-8 w-full justify-start"
						on:click={() => {
							selectedProperty = property;
							detailViewState.open();
						}}
					>
						<PropertyIcon key={property.type} />
						{property.name}
					</Button>
				{/if}
			{/each}
		{:else}
			{@render header()}
			{@render content()}
			{@render clearBtn(selectedProperty.id)}
		{/if}
	</Popover.Content>
</Popover.Root>
<Drawer.Root>
	<Drawer.Trigger asChild let:builder>
		<Button builders={[builder]} variant="secondary" class="md:hidden">
			<FilterIcon class="icon-xs" />
		</Button>
	</Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Header class="py-1">
			<div class="flex items-center space-x-2">
				<div class="p-2.5 rounded bg-secondary">
					<FilterIcon class="icon-sm" />
				</div>
				<div class="text-base font-semibold">Filters</div>
			</div>
		</Drawer.Header>
		<Drawer.Footer class="pt-2 px-1 ">
			{@render activeFilters()}
			<Accordion.Root
				class="w-full sm:max-w-[70%]"
				onValueChange={(value) => {
					if (value && typeof value === 'string') {
						const property = propertyState.getProperty(value);
						if (!property) return;
						selectedProperty = property;
						detailViewState.open();
					}
				}}
			>
				{#each propertyState.properties as property}
					{#if property.type === 'CHECKBOX' || property.type === 'SELECT'}
						<Accordion.Item value={property.id}>
							<Accordion.Trigger
								showArrow={false}
								class="justify-start space-x-2 py-0.5 px-2.5 text-sm font-semibold rounded-sm hover:no-underline hover:bg-muted"
							>
								<PropertyIcon key={property.type} class="icon-sm mr-2 rotate-0" />

								{property.name}
							</Accordion.Trigger>
							<Accordion.Content>
								<div class="px-2">
									{@render content()}
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
	<div class="w-full flex items-center space-x-2 px-2 py-0.5">
		<span class="font-semibold text-sm">
			{selectedProperty.name}
			<strong> is </strong>
		</span>
	</div>
{/snippet}

{#snippet content()}
	{#if selectedProperty.type === 'CHECKBOX'}
		<RadioGroup.Root class="w-full gap-y-0">
			<Label
				for={`${selectedProperty.id}-filter-true`}
				class="w-full flex items-center space-x-1.5 py-1.5 px-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
			>
				{@render mockCheckbox(true)}
				<span class="grow text-sm font-semibold"> Checked </span>

				<Check
					class={cn('icon-xs', !isSelected(selectedProperty.id, 'true') && 'text-transparent')}
				/>
				<RadioGroup.Item
					value="true"
					id={`${selectedProperty.id}-filter-true`}
					class="sr-only"
					on:click={() => onClickFilterOption(selectedProperty.id, 'true', selectedProperty.type)}
				/>
			</Label>
			<Label
				for={`${selectedProperty.id}-filter-false`}
				class="w-full flex items-center space-x-1.5 py-1.5 px-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
			>
				{@render mockCheckbox(false)}
				<span class="grow text-sm font-semibold"> Unchecked </span>

				<Check
					class={cn('icon-xs', !isSelected(selectedProperty.id, 'false') && 'text-transparent')}
				/>

				<RadioGroup.Item
					value="false"
					id={`${selectedProperty.id}-filter-false`}
					class="sr-only"
					on:click={() => onClickFilterOption(selectedProperty.id, 'false', selectedProperty.type)}
				/>
			</Label>
		</RadioGroup.Root>
	{:else if selectedProperty.type === 'SELECT'}
		<RadioGroup.Root class="w-full gap-y-0">
			{#each selectedProperty.options as option}
				<Label
					for={`${selectedProperty.id}-filter-${option.id}`}
					class="w-full flex items-center space-x-1.5 py-1 px-1.5 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
				>
					<span class={cn('size-3.5 rounded-full', PROPERTY_COLORS[option.color])}></span>

					<span class="grow text-sm font-semibold">
						{option.value}
					</span>

					<Check
						class={cn('icon-xs', !isSelected(selectedProperty.id, option.id) && 'text-transparent')}
					/>
					<RadioGroup.Item
						value="false"
						id={`${selectedProperty.id}-filter-${option.id}`}
						class="sr-only"
						on:click={() =>
							onClickFilterOption(selectedProperty.id, option.id, selectedProperty.type)}
					/>
				</Label>
			{/each}
		</RadioGroup.Root>
	{/if}
{/snippet}

{#snippet clearBtn(id: string)}
	<Separator />
	<Button variant="ghost" class="h-8 w-full justify-start" on:click={() => detailViewState.close()}>
		Previous
	</Button>

	{#if hasValues(id)}
		<Button variant="ghost" class="h-8 w-full justify-start" on:click={() => clearFilter(id)}>
			Clear
		</Button>
	{/if}
{/snippet}

{#snippet activeFilters()}
	{@const bg = 'h-6 flex items-center space-x-1 py-0.5 px-1 rounded-sm'}
	{#if filters.length > 0}
		<p class="w-full text-xs font-semibold px-2 py-0.5">Active filters</p>
		<div class="w-full flex flex-wrap gap-1 px-2 pb-0.5">
			{#each filters as filter}
				{@const property = propertyState.getProperty(filter.id)}

				{#if property}
					{#if property.type === 'CHECKBOX'}
						{@const value = filter.values[0]}
						<Button class={cn(bg, PROPERTY_COLORS['GRAY'])} on:click={() => clearFilter(filter.id)}>
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
									on:click={() => {
										onClickFilterOption(filter.id, option.id, property.type);
									}}
								>
									<span class={cn('size-3 rounded-full', PROPERTY_COLORS[option.color])}></span>
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

			<Button class={cn(bg, PROPERTY_COLORS['GRAY'])} on:click={() => clearAll()}>Clear all</Button>
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
