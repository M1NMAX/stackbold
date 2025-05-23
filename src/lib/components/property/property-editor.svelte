<script module lang="ts">
	const UNIVESAL_AGGREGATORS = [
		Aggregator.NONE,
		Aggregator.COUNT,
		Aggregator.COUNT_EMPTY,
		Aggregator.COUNT_NOT_EMPTY
	];
	const NUMBER_EXCLUSIVE_AGGREGATORS = [Aggregator.SUM, Aggregator.AVG];
</script>

<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import GripVertical from 'lucide-svelte/icons/grip-vertical';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';
	import Trash from 'lucide-svelte/icons/trash';
	import Settings from 'lucide-svelte/icons/settings';
	import { Aggregator, PropertyType, View, type Property } from '@prisma/client';
	import { capitalizeFirstLetter, tm, useId } from '$lib/utils/index.js';
	import {
		// utils
		containsView,
		getPropertyState,
		toggleView,
		// components
		PropertyIcon,
		PropertyOption,
		isSelectable
	} from './index.js';
	import {
		DEBOUNCE_INTERVAL,
		MIN_SEARCHABLE_PROPERTY_SELECT,
		PROPERTY_AGGREGATOR_LABELS,
		PROPERTY_COLORS,
		PROPERTY_DEFAULT_VALUE_NOT_DEFINED
	} from '$lib/constant/index.js';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';
	import type { UpdProperty, SelectOption } from '$lib/types';
	import debounce from 'debounce';
	import { getItemState } from '$lib/components/items/index.js';
	import {
		AdaptiveWrapper,
		Button,
		Field,
		HSeparator,
		Label,
		Select,
		Switch
	} from '$lib/components/base/index.js';
	import { tick } from 'svelte';
	import { fade, slide } from 'svelte/transition';

	type Props = {
		property: Property;
		isOpen: boolean;
		idx: number;
		openChange: (value: string | null) => void;
	};

	let { property, isOpen, idx, openChange }: Props = $props();

	let dragging = $state(false);
	let dragover = $state(false);

	const deleteModal = getDeleteModalState();
	const propertyState = getPropertyState();
	const itemState = getItemState();
	const newOptionInputId = useId(`property-editor-${property.id}`);
	const newOptionInputState = new ModalState();
	const showAllOptions = new ModalState();
	const menuState = new ModalState();

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
		menuState.close();
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
		let options: SelectOption[] = [];

		options.push(
			...UNIVESAL_AGGREGATORS.map((aggregator) => ({
				id: aggregator,
				label: PROPERTY_AGGREGATOR_LABELS[aggregator.toLowerCase()],
				isSelected: aggregator === property.aggregator
			}))
		);

		if (property.type === 'NUMBER') {
			options.push(
				...NUMBER_EXCLUSIVE_AGGREGATORS.map((aggregator) => ({
					id: aggregator,
					label: PROPERTY_AGGREGATOR_LABELS[aggregator.toLowerCase()],
					isSelected: aggregator === property.aggregator
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

	function getMaxVisisbleOptions() {
		if (!isSelectable(property.type)) return 0;
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
		e.dataTransfer.setData('text/plain', idx.toString());
	}

	async function ondrop(e: DragEvent) {
		dragover = false;
		dragging = false;
		if (!e.dataTransfer) return;
		e.dataTransfer.dropEffect = 'move';
		const start = +e.dataTransfer.getData('text/plain');
		await propertyState.orderProperty(start, idx);
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
	class="flex group pr-4 my-0.5"
	draggable="true"
	{ondragstart}
	{ondrop}
	{ondragend}
	{ondragover}
	{ondragleave}
>
	<GripVertical
		class={tm(
			'size-4 cursor-pointer invisible group-hover:visible',
			'opacity-50 hover:opacity-100 transition-opacity',
			isOpen ? 'mt-5' : 'mt-3.5'
		)}
	/>
	<div
		class={tm(
			'grow border-2 ',
			isOpen ? 'rounded my-2' : 'rounded-sm my-0.5',
			dragover ? 'border-secondary/60' : 'border-2 border-secondary',
			dragging && 'select-text outline-0 min-w-0'
		)}
	>
		<div class={tm('flex bg-secondary ', dragover && 'bg-opacity-60')}>
			<div class="relative w-full border-r border-card p-0.5">
				<div class="absolute inset-y-0 pl-1 flex items-center pointer-events-none">
					<PropertyIcon key={property.type} />
				</div>

				<label for={`${property.id}-name`} class="sr-only"> Name</label>
				<input
					id={`${property.id}-name`}
					value={property.name}
					name="name"
					type="text"
					class="w-full h-8 pl-7 text-sm rounded-md bg-transparent focus:bg-card placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
					oninput={handleOnInput}
				/>
			</div>
			<Button
				theme="ghost"
				variant="icon"
				class="hover:bg-card hover:text-card-foreground rounded-3xl"
				onclick={() => openChange(isOpen ? null : property.id)}
			>
				<Settings />
			</Button>
		</div>
		{#if isOpen}
			<div class="flex flex-col gap-y-1 p-2" transition:slide>
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

				{#if isSelectable(property.type)}
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
				{#if isSelectable(property.type)}
					<HSeparator />
					{@render propertyOptions()}
				{/if}

				<HSeparator />
				<div class="grid grid-cols-1 md:grid-cols-9 gap-1 py-2">
					{#each Object.values(View) as view}
						<div class="w-full md:w-fit col-span-4 flex items-center gap-x-2">
							<Label
								for={view}
								name={`Visible in ${capitalizeFirstLetter(view.toString())} view`}
							/>

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
			</div>
		{/if}
	</div>
</div>

{#snippet propertyOptions()}
	<div class=" flex flex-col space-y-1.5 pt-1">
		<div class="flex justify-between space-x-1">
			<span class="text-sm font-semibold">Options</span>
			<Button theme="secondary" variant="compact" onclick={() => newOptionInputState.toggle()}>
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

		<div class="space-y-1">
			{#if property.options.length >= 6}
				<Button
					theme="secondary"
					variant="menu"
					class="justify-center"
					onclick={() => showAllOptions.toggle()}
				>
					{showAllOptions.isOpen ? ' Show fewer options' : 'Show all options'}
				</Button>
			{/if}

			{#each property.options.slice(0, getMaxVisisbleOptions()) as option}
				<PropertyOption propertyId={property.id} {option} />
			{/each}
		</div>
	</div>
{/snippet}
