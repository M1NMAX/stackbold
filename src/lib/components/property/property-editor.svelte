<script module lang="ts">
	const aggregatorLabel: { [key: string]: string } = {
		none: 'None',
		count: 'Count all',
		count_empty: 'Count empty',
		count_not_empty: 'Count not empty',
		avg: 'Average',
		sum: 'Sum'
	};

	const UNIVESAL_AGGREGATORS = [
		Aggregator.NONE,
		Aggregator.COUNT,
		Aggregator.COUNT_EMPTY,
		Aggregator.COUNT_NOT_EMPTY
	];
	const NUMBER_EXCLUSIVE_AGGREGATORS = [Aggregator.SUM, Aggregator.AVG];
</script>

<script lang="ts">
	import { Aggregator, Color, PropertyType, View, type Property } from '@prisma/client';
	import { Button } from '$lib/components/ui/button';
	import { Check, Copy, Trash, Settings, SquareSlash } from 'lucide-svelte';
	import { capitalizeFirstLetter, cn } from '$lib/utils';
	import {
		// utils
		containsView,
		getOption,
		toggleView,
		// components
		PropertyOptions,
		PropertyIcon,
		getPropertyState,
		PropertyResponsiveWrapper
	} from '.';
	import {
		DEBOUNCE_INTERVAL,
		PROPERTY_COLORS,
		PROPERTY_DEFAULT_VALUE_NOT_DEFINED
	} from '$lib/constant';
	import { Separator } from '$lib/components/ui/separator';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { getDeleteModalState, ModalState } from '$lib/components/modal';
	import type { UpdProperty } from '$lib/types';
	import debounce from 'debounce';
	import { getItemState } from '$lib/components/items';
	import { slide } from 'svelte/transition';

	type Props = {
		property: Property;
		isOpen: boolean;
		openChange: (value: string | null) => void;
	};

	let { property, isOpen = false, openChange }: Props = $props();

	// menus wrapper
	const typeWrapper = new ModalState();
	const aggregatorWrapper = new ModalState();
	const defaultValueWrapper = new ModalState();

	const deleteModal = getDeleteModalState();
	const propertyState = getPropertyState();
	const itemState = getItemState();

	async function duplicateProperty() {
		await propertyState.duplicateProperty(property.id);
		const prop = propertyState.getMostRecentProperty(propertyState.properties);
		await itemState.addPropertyRef(prop.id);
	}

	const updPropertyDebounced = debounce(updProperty, DEBOUNCE_INTERVAL);
	async function updProperty(property: UpdProperty) {
		await propertyState.updProperty(property);
	}

	function handleOnInput(e: Event) {
		// TODO: clean property value, when property type changes
		const targetEl = e.target as HTMLInputElement;
		updPropertyDebounced({ id: property.id, name: targetEl.value });
	}

	function deleteProperty() {
		deleteModal.open({
			id: property.id,
			type: 'property',
			name: property.name,
			fun: async () => {
				await propertyState.deleteProperty(property.id);
				await itemState.deletePropertyRef(property.id);
			}
		});
	}

	// style
	const popoverClass =
		'w-[var(--bits-popover-anchor-width)] min-w-[var(--bits-popover-anchor-width)] px-0.5 pt-1';

	const drawerClass = 'p-2';
	const btnClass = 'w-full justify-start px-0';

	type RadioItemIcon =
		| { type: null }
		| { type: 'property'; key: PropertyType }
		| { type: 'default-value'; color?: Color };
	type RadioItemProps = {
		id: string;
		value: string;
		isSelected: boolean;
		icon: RadioItemIcon;
		onClickItem: () => void;
	};
</script>

<div class="p-1 rounded bg-secondary/40 text-secondary-foreground">
	<div class="flex space-x-0.5">
		<div class="relative w-full">
			<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
				<PropertyIcon key={property.type} />
			</div>

			<label for={`${property.id}-name`} class="sr-only"> Name</label>
			<input
				id={`${property.id}-name`}
				value={property.name}
				name="name"
				type="text"
				class="w-full h-9 pl-9 text-sm rounded-sm bg-secondary placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
				oninput={handleOnInput}
			/>
		</div>
		<Button variant="secondary" size="icon" onclick={() => openChange(isOpen ? null : property.id)}>
			<Settings />
		</Button>
	</div>
	{#if isOpen}
		<div class="flex flex-col gap-y-1 pt-2 px-1" transition:slide>
			<div class="selector-container">
				<div>Type</div>

				<PropertyResponsiveWrapper
					bind:open={typeWrapper.isOpen}
					alignCenter={false}
					{btnClass}
					mobileClass={drawerClass}
					desktopClass={popoverClass}
				>
					{#snippet header()}
						<div class="flex items-center gap-x-1.5">
							<PropertyIcon key={property.type} class="icon-sm" />
							{capitalizeFirstLetter(property.type.toString())}
						</div>
					{/snippet}

					<div>
						<p class="menu-heading">Type</p>
						<RadioGroup.Root value={property.type} class="gap-y-0">
							{#each Object.values(PropertyType) as propertyType}
								{@render RadioItem({
									id: propertyType,
									value: capitalizeFirstLetter(propertyType),
									isSelected: property.type === propertyType,
									icon: { type: 'property', key: propertyType },
									onClickItem: () => {
										updProperty({ id: property.id, type: propertyType });
										typeWrapper.close();
									}
								})}
							{/each}
						</RadioGroup.Root>
					</div>
				</PropertyResponsiveWrapper>
			</div>

			<div class="selector-container">
				<p class="text-sm">Aggregator</p>

				<PropertyResponsiveWrapper
					bind:open={aggregatorWrapper.isOpen}
					alignCenter={false}
					{btnClass}
					mobileClass={drawerClass}
					desktopClass={popoverClass}
				>
					{#snippet header()}
						{aggregatorLabel[property.aggregator.toLowerCase()]}
					{/snippet}

					<div>
						<p class="menu-heading">Aggregator</p>
						<RadioGroup.Root value={property.aggregator} class="gap-y-0">
							{#each UNIVESAL_AGGREGATORS as aggregator}
								{@render RadioItem({
									id: aggregator,
									value: aggregatorLabel[aggregator.toLowerCase()],
									isSelected: property.aggregator === aggregator,
									icon: { type: null },
									onClickItem: () => {
										updProperty({ id: property.id, aggregator });
										aggregatorWrapper.close();
									}
								})}
							{/each}

							{#if property.type === 'NUMBER'}
								{#each NUMBER_EXCLUSIVE_AGGREGATORS as aggregator}
									{@render RadioItem({
										id: aggregator,
										value: aggregatorLabel[aggregator.toLowerCase()],
										isSelected: property.aggregator === aggregator,
										icon: { type: null },
										onClickItem: () => {
											updProperty({ id: property.id, aggregator });
											aggregatorWrapper.close();
										}
									})}
								{/each}
							{/if}
						</RadioGroup.Root>
					</div>
				</PropertyResponsiveWrapper>
			</div>

			{#if property.type === 'SELECT'}
				{@const selectedOpt = getOption(property.options, property.defaultValue)}

				<div class="selector-container">
					<p class="text-sm">Default value</p>

					<PropertyResponsiveWrapper
						bind:open={defaultValueWrapper.isOpen}
						alignCenter={false}
						{btnClass}
						mobileClass={drawerClass}
						desktopClass={popoverClass}
					>
						{#snippet header()}
							<div class="flex items-center">
								{#if selectedOpt}
									<span class={cn('size-3.5 rounded-sm mr-2', PROPERTY_COLORS[selectedOpt.color])}
									></span>
									{selectedOpt.value}
								{:else}
									<SquareSlash class="size-3.5 mr-2" />
									{PROPERTY_DEFAULT_VALUE_NOT_DEFINED}
								{/if}
							</div>
						{/snippet}

						<div>
							<p class="menu-heading">Default value</p>
							<RadioGroup.Root value={property.defaultValue} class="gap-y-0">
								{@render RadioItem({
									id: 'default-value-none',
									value: PROPERTY_DEFAULT_VALUE_NOT_DEFINED,
									isSelected: property.defaultValue === '',
									icon: { type: 'default-value' },
									onClickItem: () => {
										updProperty({ id: property.id, defaultValue: '' });
										defaultValueWrapper.close();
									}
								})}

								{#each property.options as option}
									{@render RadioItem({
										id: option.id,
										value: option.value,
										isSelected: property.defaultValue === option.id,
										icon: { type: 'default-value', color: option.color },
										onClickItem: () => {
											updProperty({ id: property.id, defaultValue: option.id });
											defaultValueWrapper.close();
										}
									})}
								{/each}
							</RadioGroup.Root>
						</div>
					</PropertyResponsiveWrapper>
				</div>
			{/if}

			<div class="grid grid-cols-2 grid-flow-row gap-1 py-2">
				{#each Object.values(View) as view}
					<div class="flex items-center gap-x-2">
						<Switch
							id={view}
							checked={containsView(property.visibleInViews, view)}
							onCheckedChange={() => {
								updProperty({
									id: property.id,
									visibleInViews: toggleView(property.visibleInViews, view)
								});
							}}
						/>
						<Label for={view} class="text-sm font-semibold">
							Visible in {capitalizeFirstLetter(view.toString())} view
						</Label>
					</div>
				{/each}
			</div>
			{#if property.type === 'SELECT'}
				<Separator />
				<PropertyOptions propertyId={property.id} options={property.options} />
			{/if}

			<Separator />
			<div class="flex justify-end items-center space-x-1.5 pt-1">
				<Button variant="secondary" onclick={() => duplicateProperty()}>
					<Copy class="icon-xs" />
					<span> Duplicate</span>
				</Button>

				<Button variant="secondary" class="hover:text-primary" onclick={() => deleteProperty()}>
					<Trash class="icon-xs" />
					<span> Delete</span>
				</Button>
			</div>
		</div>
	{/if}
</div>

{#snippet RadioItem(itemProps: RadioItemProps)}
	{@const icon = itemProps.icon}
	<Label
		for={itemProps.id}
		class="w-full flex items-center gap-x-2 py-1.5 px-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
	>
		{#if icon.type}
			{#if icon.type === 'property'}
				<PropertyIcon key={icon.key} class="size-3.5" />
			{:else if icon.type === 'default-value'}
				{#if icon.color}
					<span class={cn('size-3.5 rounded-sm', PROPERTY_COLORS[icon.color])}> </span>
				{:else}
					<SquareSlash class="size-3.5" />
				{/if}
			{/if}
		{/if}
		<span class="label-text">
			{itemProps.value}
		</span>

		<Check class={cn('size-5', !itemProps.isSelected && 'text-transparent')} />
		<RadioGroup.Item
			id={itemProps.id}
			value={itemProps.id}
			class="sr-only"
			onclick={() => itemProps.onClickItem()}
		/>
	</Label>
{/snippet}

<style>
	.selector-container {
		@apply py-1 px-2 rounded bg-secondary text-secondary-foreground;
	}

	.menu-heading {
		@apply font-semibold text-sm text-center px-0 pb-0.5 pt-1 md:sr-only;
	}

	.label-text {
		@apply grow text-sm font-semibold pr-10;
	}
</style>
