<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import ChevronsDownUp from 'lucide-svelte/icons/chevrons-down-up';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import GripVertical from 'lucide-svelte/icons/grip-vertical';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';
	import Trash from 'lucide-svelte/icons/trash';
	import { Aggregator, PropertyType, type Property } from '@prisma/client';
	import {
		capitalizeFirstLetter,
		hasOptions,
		isPropertyNumerical,
		tm,
		useId
	} from '$lib/utils/index.js';
	import { getPropertyState, PropertyIcon, PropertyOption } from './index.js';
	import {
		DEBOUNCE_INTERVAL,
		MIN_SEARCHABLE_PROPERTY_SELECT,
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
	import type { UpdProperty, SelectOption, Nullable } from '$lib/types';
	import debounce from 'debounce';
	import { getItemState } from '$lib/components/item/index.js';
	import {
		AdaptiveWrapper,
		Button,
		Field,
		HSeparator,
		Label,
		Select,
		Tooltip
	} from '$lib/components/base/index.js';
	import { tick } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { getCollectionState } from '$lib/components/collection/index.js';
	import { getViewState } from '$lib/components/view/index.js';

	type Props = {
		property: Property;
		isOpen: boolean;
		openChange: (value: string | null) => void;
	};

	let { property, isOpen, openChange }: Props = $props();

	let dragging = $state(false);
	let dragover = $state(false);

	const deleteModal = getDeleteModalState();
	const collectionState = getCollectionState();
	const viewState = getViewState();
	const propertyState = getPropertyState();
	const itemState = getItemState();
	const newOptionInputId = useId(`property-editor-${property.id}`);
	const newOptionInputState = new ModalState();
	const showAllOptions = new ModalState();
	const menuState = new ModalState();

	async function duplicateProperty() {
		await propertyState.duplicateProperty(property.id);
		await itemState.refresh(viewState.viewShortId);
	}

	const updPropertyDebounced = debounce(updProperty, DEBOUNCE_INTERVAL);
	async function updProperty(property: UpdProperty) {
		await propertyState.updProperty(property);
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
		options.push({
			id: '',
			icon: 'text',
			label: VALUE_NOT_DEFINED,
			isSelected: !property.defaultValue
		});

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

	function getIdPrefix(tail: string) {
		return `${property.id}-${tail}`;
	}

	function getTargetCollection(properties: Property[], pid: string) {
		const target = properties.find((prop) => prop.id === pid);
		return target ? target.targetCollection : null;
	}

	function getMaxVisisbleOptions() {
		if (!hasOptions(property.type)) return 0;
		if (property.options.length < 6) return property.options.length;
		return showAllOptions.isOpen ? property.options.length : 5;
	}

	function ondragover(e: DragEvent) {
		e.preventDefault();
		dragover = true;
	}

	function ondragleave(e: DragEvent) {
		e.preventDefault();
		dragover = false;
	}

	function ondragend() {
		dragging = false;
		dragover = false;
	}

	function ondragstart(e: DragEvent) {
		dragging = true;
		if (!e.dataTransfer) return;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.dropEffect = 'move';
		e.dataTransfer.setData('text/plain', property.order.toString());
	}

	async function ondrop(e: DragEvent) {
		dragover = false;
		dragging = false;
		if (!e.dataTransfer) return;
		e.dataTransfer.dropEffect = 'move';
		const start = +e.dataTransfer.getData('text/plain');
		await propertyState.orderProperty(start, property.order);
	}

	$effect(() => {
		if (newOptionInputState.isOpen) {
			tick().then(() => {
				document.getElementById(newOptionInputId)?.focus();
			});
		}
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	draggable="true"
	{ondragstart}
	{ondrop}
	{ondragend}
	{ondragover}
	{ondragleave}
	class={tm(
		'grow border-2 ',
		isOpen ? 'rounded' : 'rounded-md',
		dragover ? 'border-secondary/60' : 'border-2 border-secondary',
		dragging && 'outline-0 min-w-0'
	)}
>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		onclick={() => openChange(isOpen ? null : property.id)}
		class={tm(
			'h-8 flex items-center gap-x-2 py-1 px-1.5 bg-secondary cursor-pointer group',
			dragover && 'bg-opacity-60'
		)}
	>
		<PropertyIcon key={property.type} class="flex group-hover:hidden" />
		<GripVertical class="size-5 cursor-grab opacity-80 hidden group-hover:flex" />

		<div class="grow">{property.name}</div>

		<ChevronLeft class={tm('size-4 transition-transform', isOpen ? '-rotate-90' : 'rotate-0')} />
	</div>
	{#if isOpen}
		<div class="flex flex-col gap-y-1 p-2" transition:slide>
			<Field>
				<Label for={getIdPrefix('property-name')} name="Name" />
				<input
					id={getIdPrefix('property-name')}
					value={property.name}
					type="text"
					name="name"
					oninput={handleOnInput}
					class="input input-ghost"
					maxlength={MAX_PROPERTY_NAME_LENGTH}
				/>
			</Field>
			<Field>
				<Label for={getIdPrefix('property-type')} name="Type" />
				<Select
					id={getIdPrefix('property-type')}
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
					<Label for={getIdPrefix('property-format')} name="Format" />
					<Select
						id={getIdPrefix('property-format')}
						options={setupNumberFormatOptions()}
						onselect={(opt) => updProperty({ id: property.id, format: opt.id || null })}
						placeholder="Empty"
						searchable
					/>
				</Field>
				<Field>
					<Label for={getIdPrefix('property-decimals')} name="Decimals" />
					<Select
						id={getIdPrefix('property-decimals')}
						options={setupNumberDecimalOptions()}
						onselect={(opt) => updProperty({ id: property.id, decimals: +opt.id || null })}
						placeholder="Empty"
						searchable
					/>
				</Field>
			{:else if property.type === PropertyType.RELATION}
				<Field>
					<Label for={getIdPrefix('property-target-collection')} name="Related to" />
					<Select
						id={getIdPrefix('property-target-collection')}
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
					<Label for={getIdPrefix('property-target-relation')} name="Relation" />
					<Select
						id={getIdPrefix('property-target-relation')}
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
					<Label for={getIdPrefix('property-ext-target-property')} name="Target Property" />
					<Select
						id={getIdPrefix('property-ext-target-property')}
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
					<Label for={getIdPrefix('property-calculate')} name="Calculate" />
					<Select
						id={getIdPrefix('property-calculate')}
						options={setupAggregatorSelectOptions(
							isPropertyNumerical(property),
							property.calculate
						)}
						onselect={(opt) => handleUpdPropertyCalculate(opt.id ? (opt.id as Aggregator) : null)}
						placeholder="Empty"
						searchable
					/>
				</Field>
			{/if}

			<HSeparator />
			<div class="flex justify-end items-center">
				<AdaptiveWrapper bind:open={menuState.isOpen} floatingAlign="end">
					{#snippet trigger()}
						<Ellipsis />
					{/snippet}
					<Button theme="ghost" variant="menu" onclick={() => duplicateProperty()}>
						<Copy />
						<span> Duplicate property</span>
					</Button>

					<Button theme="danger" variant="menu" onclick={() => deleteProperty()}>
						<Trash />
						<span> Delete property</span>
					</Button>
				</AdaptiveWrapper>
			</div>
		</div>
	{/if}
</div>

{#snippet propertyOptions()}
	<div class=" flex flex-col space-y-1.5 pt-1">
		<div class="flex items-center justify-between space-x-1">
			<span class="grow text-sm font-semibold">Options</span>
			<Button
				id={`property-${property.id}-add-opt-btn`}
				theme="secondary"
				variant="cicon"
				onclick={() => newOptionInputState.toggle()}
			>
				{#if newOptionInputState.isOpen}
					<X />
				{:else}
					<Plus />
				{/if}
			</Button>

			{#if !newOptionInputState.isOpen}
				<Tooltip triggerBy={`property-${property.id}-add-opt-btn`} align="end" placement="bottom">
					Add option
				</Tooltip>
			{/if}

			{#if property.options.length >= 6}
				{@const tooltipId = useId(`property-editor-toggle-option-list-tooltip-${property.id}`)}
				<Button
					id={tooltipId}
					theme="secondary"
					variant="cicon"
					onclick={() => showAllOptions.toggle()}
				>
					{#if showAllOptions.isOpen}
						<ChevronsDownUp />
					{:else}
						<ChevronsUpDown />
					{/if}
				</Button>
				<Tooltip triggerBy={tooltipId} align="end" placement="bottom">
					{showAllOptions.isOpen ? 'Show fewer options' : 'Show all options'}
				</Tooltip>
			{/if}
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

		<div class="space-y-1">
			{#each property.options.slice(0, getMaxVisisbleOptions()) as option}
				<PropertyOption propertyId={property.id} {option} />
			{/each}
			{#if property.options.length >= 6}
				<Button
					theme="secondary"
					variant="menu"
					class="justify-center rounded-md"
					onclick={() => showAllOptions.toggle()}
				>
					{showAllOptions.isOpen ? 'Show fewer options' : 'Show all options'}
				</Button>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet defaultValueSelector()}
	<Field>
		<Label for={getIdPrefix('property-default-value')} name="Default value" />
		<Select
			id={getIdPrefix('property-default-value')}
			options={setupDefaultOptionSelectOptions()}
			onselect={(opt) => updProperty({ id: property.id, defaultValue: opt.id || null })}
			searchable={property.options.length >= MIN_SEARCHABLE_PROPERTY_SELECT}
		/>
	</Field>
{/snippet}
