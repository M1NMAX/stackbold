<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';
	import Trash from 'lucide-svelte/icons/trash';
	import { Aggregator, PropertyType, type Property } from '@prisma/client';
	import { capitalizeFirstLetter, isPropertyNumerical, tm, useId } from '$lib/utils/index.js';
	import { getPropertyState, PropertyOption } from './index.js';
	import {
		DEBOUNCE_INTERVAL,
		NUMBERICAL_PROPERTY_EXCLUSIVE_AGGREGATORS,
		PROPERTIES_WITH_LISTABLE_OPTIONS,
		PROPERTY_AGGREGATOR_LABELS,
		THEME_COLORS,
		VALUE_NOT_DEFINED,
		PROPERTY_UNIVERSAL_AGGREGATORS,
		VALUE_NONE,
		MAX_PROPERTY_NAME_LENGTH,
		NUMBER_FORMATS,
		NUMBER_FORMAT_LABELS
	} from '$lib/constant/index.js';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';
	import type { UpdProperty, SelectOption, Nullable, PropertyWithOptions } from '$lib/types';
	import debounce from 'debounce';
	import { getItemState } from '$lib/components/item/index.js';
	import {
		Badge,
		Button,
		ExpandableEditor,
		Field,
		HSeparator,
		Label,
		Select
	} from '$lib/components/base/index.js';
	import { tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { getCollectionState } from '$lib/components/collection/index.js';
	import { getViewState } from '$lib/components/view/index.js';

	type Props = {
		property: PropertyWithOptions;
	};

	let { property }: Props = $props();

	let expandedPropertyOption = $state<string | null>(null);

	const deleteModal = getDeleteModalState();
	const collectionState = getCollectionState();
	const viewState = getViewState();
	const propertyState = getPropertyState();
	const itemState = getItemState();
	const newOptionInputId = useId('property-editor');
	const newOptionInputState = new ModalState();
	const menuState = new ModalState();

	async function duplicateProperty() {
		await propertyState.duplicateProperty(property.id);
		await itemState.refresh(viewState.viewShortId);
	}

	const updPropertyDebounced = debounce(updProperty, DEBOUNCE_INTERVAL);
	async function updProperty(property: UpdProperty) {
		await propertyState.updProperty(property);
		await viewState.refresh();
	}

	async function handleUpdPropertyCalculate(aggregator: Nullable<Aggregator>) {
		await propertyState.updProperty({ id: property.id, calculate: aggregator });
		await itemState.refresh(viewState.viewShortId);
	}

	function handleOnInput(e: Event) {
		// TODO: clean property value, when property type changes
		const targetEl = e.target as HTMLInputElement;
		updPropertyDebounced({ id: property.id, name: targetEl.value });
	}

	function deleteProperty() {
		menuState.close();
		deleteModal.open({
			id: property.id,
			type: 'property',
			name: property.name,
			fun: async () => {
				await propertyState.deleteProperty(property.id);
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

	function setupAggregatorSelectOptions(isNumerical: boolean, current: Nullable<Aggregator>) {
		let options: SelectOption[] = [];

		options.push({
			id: '',
			label: VALUE_NONE,
			isSelected: !current
		});

		options.push(
			...PROPERTY_UNIVERSAL_AGGREGATORS.map((aggregator) => ({
				id: aggregator,
				label: PROPERTY_AGGREGATOR_LABELS[aggregator.toLowerCase()],
				isSelected: aggregator === current
			}))
		);

		if (isNumerical) {
			options.push(
				...NUMBERICAL_PROPERTY_EXCLUSIVE_AGGREGATORS.map((aggregator) => ({
					id: aggregator,
					label: PROPERTY_AGGREGATOR_LABELS[aggregator.toLowerCase()],
					isSelected: aggregator === current
				}))
			);
		}
		return options;
	}

	function setupDefaultOptionSelectOptions() {
		let options: SelectOption[] = [];

		options.push(
			...property.options.map((option) => ({
				id: option.id,
				label: option.value,
				isSelected: property.defaultValue === option.id,
				theme: THEME_COLORS[option.color]
			}))
		);

		return options;
	}

	function setupNumberFormatOptions() {
		const options: SelectOption[] = [];

		options.push({
			id: '',
			label: NUMBER_FORMAT_LABELS['NUMBER'],
			isSelected: !property.format
		});

		options.push(
			...NUMBER_FORMATS.map((format) => ({
				id: format,
				label: NUMBER_FORMAT_LABELS[format],
				isSelected: property.format === format
			}))
		);
		return options;
	}

	function setupNumberDecimalOptions() {
		const decimalCounts = [0, 1, 2, 3, 4, 5];

		return [
			{
				id: '',
				label: 'Default',
				isSelected: !property.decimals
			},
			...decimalCounts.map((n) => ({
				id: n.toString(),
				label: n.toString(),
				isSelected: n === property.decimals
			}))
		];
	}

	function handleKeypress(e: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		e.stopPropagation();
		if (e.key !== 'Enter') return;
		const value = e.currentTarget.value;
		propertyState.addOptionToProperty(property.id, value);
		e.currentTarget.value = '';
	}

	function getIdWithPrefix(tail: string) {
		return `${property.id}-${tail}`;
	}

	function getTargetCollection(properties: Property[], pid: string) {
		const target = properties.find((prop) => prop.id === pid);
		return target ? target.targetCollection : null;
	}

	function isViewOptionExpanded(oid: string) {
		return expandedPropertyOption === oid;
	}

	function onclickExpandableOptionEditor(oid: string) {
		expandedPropertyOption = isViewOptionExpanded(oid) ? null : oid;
	}

	$effect(() => {
		if (newOptionInputState.isOpen) {
			tick().then(() => {
				document.getElementById(newOptionInputId)?.focus();
			});
		}
	});
</script>

<Field>
	<Label for={getIdWithPrefix('property-name')} name="Name" />
	<input
		id={getIdWithPrefix('property-name')}
		value={property.name}
		type="text"
		name="name"
		oninput={handleOnInput}
		class="input input-ghost"
		maxlength={MAX_PROPERTY_NAME_LENGTH}
	/>
</Field>
<Field>
	<Label for={getIdWithPrefix('property-type')} name="Type" />
	<Select
		id={getIdWithPrefix('property-type')}
		options={setupPropertyTypeSelectOptions()}
		onselect={(opt) => updProperty({ id: property.id, type: opt.id as PropertyType })}
		searchable
	/>
</Field>

{#if PROPERTIES_WITH_LISTABLE_OPTIONS.includes(property.type)}
	{@render defaultValueSelector()}
	<HSeparator />
	{@render propertyOptions()}
{:else if property.type === PropertyType.NUMBER}
	<Field>
		<Label for={getIdWithPrefix('property-format')} name="Format" />
		<Select
			id={getIdWithPrefix('property-format')}
			options={setupNumberFormatOptions()}
			onselect={(opt) => updProperty({ id: property.id, format: opt.id || null })}
			placeholder="Empty"
			searchable
		/>
	</Field>
	<Field>
		<Label for={getIdWithPrefix('property-decimals')} name="Decimals" />
		<Select
			id={getIdWithPrefix('property-decimals')}
			options={setupNumberDecimalOptions()}
			onselect={(opt) => updProperty({ id: property.id, decimals: +opt.id || null })}
			placeholder="Empty"
			searchable
		/>
	</Field>
{:else if property.type === PropertyType.RELATION}
	<Field>
		<Label for={getIdWithPrefix('property-target-collection')} name="Related to" />
		<Select
			id={getIdWithPrefix('property-target-collection')}
			options={collectionState.collections.map((collection) => ({
				id: collection.id,
				label: collection.name,
				icon: collection.icon,
				isSelected: collection.id === property.targetCollection
			}))}
			onselect={(opt) => updProperty({ id: property.id, targetCollection: opt.id || null })}
			placeholder="Empty"
			searchable
		/>
	</Field>

	{@render defaultValueSelector()}
{:else if property.type === PropertyType.BUNDLE}
	{@const relations = propertyState.properties.filter(
		(prop) => prop.type === PropertyType.RELATION
	)}

	<Field>
		<Label for={getIdWithPrefix('property-target-relation')} name="Relation" />
		<Select
			id={getIdWithPrefix('property-target-relation')}
			options={relations.map((prop) => ({
				id: prop.id,
				label: prop.name,
				icon: prop.type.toLowerCase(),
				isSelected: prop.id === property.intTargetProperty
			}))}
			onselect={(opt) => {
				updProperty({
					id: property.id,
					intTargetProperty: opt.id || null,
					targetCollection: getTargetCollection(relations, opt.id)
				});
			}}
			placeholder="Empty"
			searchable
		/>
	</Field>
	<Field>
		<Label for={getIdWithPrefix('property-ext-target-property')} name="Target Property" />
		<Select
			id={getIdWithPrefix('property-ext-target-property')}
			options={property.options.map((opt) => ({
				id: opt.id,
				label: opt.value,
				icon: opt.extra ? opt.extra.toLowerCase() : '',
				isSelected: opt.id === property.extTargetProperty
			}))}
			onselect={(opt) => {
				updProperty({ id: property.id, extTargetProperty: opt.id || null });
			}}
			placeholder="Empty"
			searchable
		/>
	</Field>
	<Field>
		<Label for={getIdWithPrefix('property-calculate')} name="Calculate" />
		<Select
			id={getIdWithPrefix('property-calculate')}
			options={setupAggregatorSelectOptions(isPropertyNumerical(property), property.calculate)}
			onselect={(opt) => handleUpdPropertyCalculate(opt.id ? (opt.id as Aggregator) : null)}
			placeholder="Empty"
			searchable
		/>
	</Field>
{/if}

<HSeparator />
<div class="flex justify-end items-center">
	<Button theme="ghost" onclick={() => duplicateProperty()}>
		<Copy />
		<span> Duplicate </span>
	</Button>

	<Button theme="danger" onclick={() => deleteProperty()}>
		<Trash />
		<span> Delete </span>
	</Button>
</div>

{#snippet propertyOptions()}
	<div class=" flex flex-col space-y-1.5 px-1">
		<div class="flex items-center justify-between space-x-1">
			<span class="grow text-sm font-semibold">Options</span>
			<Button theme="secondary" variant="cicon" onclick={() => newOptionInputState.toggle()}>
				{#if newOptionInputState.isOpen}
					<X />
				{:else}
					<Plus />
				{/if}
			</Button>
		</div>

		<input
			transition:fade
			onkeypress={handleKeypress}
			id={newOptionInputId}
			placeholder="Enter option value"
			class={tm(
				'h-8 w-full p-1 rounded-sm border border-input bg-secondary text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 hidden',
				newOptionInputState.isOpen && 'block'
			)}
		/>

		<div>
			{#each property.options as option}
				<ExpandableEditor
					isExpanded={isViewOptionExpanded(option.id)}
					onclickHeader={() => onclickExpandableOptionEditor(option.id)}
					ondragEditor={(dt) => {
						dt.setData('text/plain', option.order.toString());
					}}
					ondropEditor={async (dt) => {
						const start = +dt.getData('text/plain');
						await propertyState.orderPropertyOption(property.id, start, option.order);
					}}
					group="options"
				>
					{#snippet header()}
						<Badge color={option.color}>{option.value}</Badge>
					{/snippet}
					<PropertyOption {option} />
				</ExpandableEditor>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet defaultValueSelector()}
	<Field>
		<Label for={getIdWithPrefix('property-default-value')} name="Default value" />
		<Select
			id={getIdWithPrefix('property-default-value')}
			options={setupDefaultOptionSelectOptions()}
			onselect={(opt) => updProperty({ id: property.id, defaultValue: opt.id || null })}
			placeholder={VALUE_NOT_DEFINED}
			searchable
		/>
	</Field>
{/snippet}
