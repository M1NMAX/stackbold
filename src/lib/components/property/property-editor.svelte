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
	import { Aggregator, PropertyType, View, type Property } from '@prisma/client';
	import { Copy, Trash, Settings } from 'lucide-svelte';
	import { capitalizeFirstLetter } from '$lib/utils';
	import {
		// utils
		containsView,
		getPropertyState,
		toggleView,
		// components
		PropertyOptions,
		PropertyIcon
	} from './index.js';
	import {
		DEBOUNCE_INTERVAL,
		MIN_SEARCHABLE_PROPERTY_SELECT,
		PROPERTY_COLORS,
		PROPERTY_DEFAULT_VALUE_NOT_DEFINED
	} from '$lib/constant';
	import { getDeleteModalState } from '$lib/states/index.js';
	import type { UpdProperty } from '$lib/types';
	import debounce from 'debounce';
	import { getItemState } from '$lib/components/items';
	import { slide } from 'svelte/transition';
	import { Button, Field, HSeparator, Label, Select, Switch } from '$lib/components/base/index.js';
	import type { Option } from '$lib/components/base/index.js';

	type Props = {
		property: Property;
		isOpen: boolean;
		openChange: (value: string | null) => void;
	};

	let { property, isOpen = false, openChange }: Props = $props();

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

	function setupPropertyTypeSelectOptions() {
		return Object.values(PropertyType).map((propertyType) => ({
			id: propertyType,
			label: capitalizeFirstLetter(propertyType),
			isSelected: propertyType === property.type,
			icon: propertyType.toLowerCase()
		}));
	}

	function setupAggregatorSelectOptions() {
		let options: Option[] = [];

		options.push(
			...UNIVESAL_AGGREGATORS.map((aggregator) => ({
				id: aggregator,
				label: aggregatorLabel[aggregator.toLowerCase()],
				isSelected: aggregator === property.aggregator
			}))
		);

		if (property.type === 'NUMBER') {
			options.push(
				...NUMBER_EXCLUSIVE_AGGREGATORS.map((aggregator) => ({
					id: aggregator,
					label: aggregatorLabel[aggregator.toLowerCase()],
					isSelected: aggregator === property.aggregator
				}))
			);
		}
		return options;
	}

	function setupDefaultOptionSelectOptions() {
		let options: Option[] = [];
		options.push({
			id: '',
			icon: 'text',
			label: PROPERTY_DEFAULT_VALUE_NOT_DEFINED,
			isSelected: property.defaultValue === ''
		});

		options.push(
			...property.options.map((option) => ({
				id: option.id,
				label: option.value,
				isSelected: property.defaultValue === option.id,
				theme: PROPERTY_COLORS[option.color]
			}))
		);

		return options;
	}

	function getIdPrefix(tail: string) {
		return `${property.id}-${tail}`;
	}
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
		<Button
			theme="secondary"
			variant="icon"
			onclick={() => openChange(isOpen ? null : property.id)}
		>
			<Settings />
		</Button>
	</div>
	{#if isOpen}
		<div class="flex flex-col gap-y-1 pt-2 px-1" transition:slide>
			<Field>
				<Label for={getIdPrefix('property-type')} name="Type" />
				<Select
					id={getIdPrefix('property-type')}
					options={setupPropertyTypeSelectOptions()}
					onselect={(opt) => updProperty({ id: property.id, type: opt.id as PropertyType })}
					searchable
				/>
			</Field>

			<Field>
				<Label for={getIdPrefix('property-aggregator')} name="Aggregator" />
				<Select
					id={getIdPrefix('property-aggregator')}
					options={setupAggregatorSelectOptions()}
					onselect={(opt) => updProperty({ id: property.id, aggregator: opt.id as Aggregator })}
					searchable
				/>
			</Field>

			{#if property.type === 'SELECT'}
				<Field>
					<Label for={getIdPrefix('property-default-value')} name="Default value" />
					<Select
						id={getIdPrefix('property-default-value')}
						options={setupDefaultOptionSelectOptions()}
						onselect={(opt) => updProperty({ id: property.id, defaultValue: opt.id })}
						searchable={property.options.length >= MIN_SEARCHABLE_PROPERTY_SELECT}
					/>
				</Field>
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-1 py-2">
				{#each Object.values(View) as view}
					<div class="w-full md:w-fit flex items-center gap-x-2">
						<Label for={view} name={`Visible in ${capitalizeFirstLetter(view.toString())} view`} />

						<Switch
							id={view}
							checked={containsView(property.visibleInViews, view)}
							onchange={() => {
								updProperty({
									id: property.id,
									visibleInViews: toggleView(property.visibleInViews, view)
								});
							}}
						/>
					</div>
				{/each}
			</div>
			{#if property.type === 'SELECT'}
				<HSeparator />
				<PropertyOptions propertyId={property.id} options={property.options} />
			{/if}

			<HSeparator />
			<div class="flex justify-end items-center space-x-1.5 pt-1">
				<Button theme="secondary" onclick={() => duplicateProperty()}>
					<Copy />
					<span> Duplicate</span>
				</Button>

				<Button theme="secondary" class="hover:text-primary" onclick={() => deleteProperty()}>
					<Trash />
					<span> Delete</span>
				</Button>
			</div>
		</div>
	{/if}
</div>
