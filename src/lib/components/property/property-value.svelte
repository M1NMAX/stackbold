<script lang="ts">
	import Eraser from 'lucide-svelte/icons/eraser';
	import {
		DEBOUNCE_INTERVAL,
		MAX_PROPERTY_NUMERIC_LENGTH,
		MAX_PROPERTY_TEXT_LENGTH,
		MAX_PROPERTY_TEXT_OVERVIEW_LENGTH,
		MIN_SEARCHABLE_PROPERTY_SELECT,
		PROPERTY_COLORS
	} from '$lib/constant';
	import { type Property, View } from '@prisma/client';
	import { tm, sanitizeNumberInput, useId } from '$lib/utils/index.js';
	import { getLocalTimeZone, parseAbsolute, parseDate } from '@internationalized/date';
	import {
		getPropertyColor,
		getPropertyRef,
		isNumerical,
		isRelation,
		isSelectable,
		joinMultiselectOptions,
		PropertyIcon,
		separeteMultiselectOptions
	} from './index.js';
	import { getItemState } from '$lib/components/items';
	import debounce from 'debounce';
	import { textareaAutoSize } from '$lib/actions/index.js';
	import { fullDateFormat, fullDateTimeFormat, ModalState } from '$lib/states/index.js';
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		Calendar,
		HSeparator,
		Select,
		Tooltip
	} from '$lib/components/base/index.js';
	import { tick } from 'svelte';

	type Props = {
		itemId: string;
		property: Property;
		view?: View;
	};

	let { itemId, property, view = View.LIST }: Props = $props();

	const itemState = getItemState();

	let wrapperState = new ModalState();

	let value = $derived(getPropertyValue());
	let color = $derived(getPropertyColor(property, value));

	const updPropertyRefDebounced = debounce(updPropertyRef, DEBOUNCE_INTERVAL);
	async function updPropertyRef(value: string) {
		if (shouldClose()) wrapperState.close();
		await itemState.updPropertyRef(itemId, { id: property.id, value });
	}

	const updTargetElValue = debounce(function (target: HTMLInputElement, value: string) {
		target.value = value;
	}, DEBOUNCE_INTERVAL);

	function handleOnInput(e: Event) {
		// TODO: add validation
		const targetEl = e.target as HTMLInputElement;

		let value = targetEl.value;
		if (isNumerical(property.type)) {
			value = sanitizeNumberInput(targetEl.value);
			updTargetElValue(targetEl, value);
		} else if (targetEl.type === 'checkbox') {
			value = targetEl.checked.toString();
		}

		updPropertyRefDebounced(value);
	}

	async function handleEnterKeypress(e: KeyboardEvent) {
		//TODO: verify what whould happen on mobile if the user press the Enter key
		if (e.key !== 'Enter') return;
		e.preventDefault();
		const targetEl = e.target as HTMLInputElement;
		const value = isNumerical(property.type) ? sanitizeNumberInput(targetEl.value) : targetEl.value;

		wrapperState.close();
		await updPropertyRef(value);
	}

	const buttonClass = $derived(
		tm(
			isTableView()
				? 'w-full justify-start  rounded-none border-0 bg-transparent hover:bg-transparent'
				: 'w-fit h-6 md:h-6 py-1 px-1.5 rounded-sm font-semibold hover:bg-current/90 hover:text-white',
			isNumerical(property.type) && 'justify-end',
			(isSelectable(property.type) || isRelation(property.type)) && 'px-0',
			!isSelectable(property.type) && !isTableView() && `${PROPERTY_COLORS['GRAY']}`
		)
	);

	const labelClass = tm('md:sr-only block font-semibold text-sm text-center px-0 py-1 select-none');

	//utils
	function getPropertyValue() {
		const item = itemState.getItem(itemId);
		if (!item) return '';

		if (property.type === 'CREATED') return item.createdAt.toISOString();

		const propertyRef = getPropertyRef(item.properties, property.id);
		if (!propertyRef) return '';

		return propertyRef.value;
	}

	function shouldClose() {
		return wrapperState.isOpen && property.type === 'DATE';
	}

	function isTableView() {
		return view === View.TABLE;
	}

	function hasInput() {
		return property.type === 'TEXT' || property.type === 'NUMBER' || property.type === 'URL';
	}

	$effect(() => {
		if (wrapperState.isOpen && hasInput()) {
			const inputEl = document.getElementById(property.id) as HTMLInputElement;
			tick().then(() => inputEl.focus());
		}
	});
</script>

{#if property.type === 'CHECKBOX'}
	<label
		class={tm(
			'flex justify-center',
			!isTableView() &&
				'inline-flex items-center justify-center space-x-1 py-0.5 px-1 rounded-sm text-sm font-semibold',
			!isTableView() && PROPERTY_COLORS[color]
		)}
	>
		<input type="checkbox" checked={value === 'true'} oninput={handleOnInput} class="checkbox" />

		<span class={tm('font-semibold', isTableView() && 'sr-only')}>{property.name} </span>
	</label>
{:else if property.type === 'SELECT' && (value || isTableView())}
	<Select
		id={`${property.id}-value-${itemId}`}
		options={[
			...property.options.map((option) => ({
				id: option.id,
				label: option.value,
				isSelected: option.id === value,
				theme: PROPERTY_COLORS[option.color]
			}))
		]}
		onselect={(opt) => updPropertyRef(opt.id)}
		searchable={property.options.length >= MIN_SEARCHABLE_PROPERTY_SELECT}
		triggerClass={buttonClass}
		placeholder=""
	/>

	{@render tooltipContent(`select-trigger-${property.id}-value-${itemId}`)}
{:else if property.type === 'MULTISELECT' && (value || isTableView())}
	{@const selectedOptions = separeteMultiselectOptions(value)}
	<Select
		id={`${property.id}-value-${itemId}`}
		options={[
			...property.options.map((option) => ({
				id: option.id,
				label: option.value,
				isSelected: selectedOptions.includes(option.id),
				theme: PROPERTY_COLORS[option.color]
			}))
		]}
		onselect={(options) => updPropertyRef(joinMultiselectOptions(options))}
		searchable={property.options.length >= MIN_SEARCHABLE_PROPERTY_SELECT}
		triggerClass={buttonClass}
		placeholder=""
		isMulti
	/>

	{@render tooltipContent(`select-trigger-${property.id}-value-${itemId}`)}
{:else if property.type === 'RELATION' && (value || isTableView())}
	<Select
		id={`${property.id}-value-${itemId}`}
		options={[
			...property.options.map((option) => ({
				id: option.id,
				label: option.value,
				isSelected: option.id === value
			}))
		]}
		onselect={(opt) => updPropertyRef(opt.id)}
		triggerClass={buttonClass}
		searchable
		placeholder=""
	/>

	{@render tooltipContent(`select-trigger-${property.id}-value-${itemId}`)}
{:else if property.type === 'DATE' && (value || isTableView())}
	<AdaptiveWrapper bind:open={wrapperState.isOpen} floatingAlign="start" triggerClass={buttonClass}>
		{#snippet trigger()}
			{#if value}
				{@const formatted = fullDateFormat(parseDate(value).toDate(getLocalTimeZone()))}
				{@render tooltipWrapper(formatted, !!value && isTableView())}
			{/if}
		{/snippet}

		<p class={labelClass}>{property.name}</p>
		<Calendar
			value={value ? parseDate(value) : undefined}
			onchange={(dt) => updPropertyRef(dt.toString())}
		/>
		{@render clearBtn()}
	</AdaptiveWrapper>
{:else if property.type === 'CREATED'}
	{@const formatted = fullDateTimeFormat(parseAbsolute(value, getLocalTimeZone()).toDate())}
	<div class={buttonVariants({ theme: 'ghost', className: buttonClass })}>
		{@render tooltipWrapper(formatted, !!value && isTableView())}
	</div>
{:else if property.type === 'TEXT' && (value || isTableView())}
	{@const content =
		value.length > MAX_PROPERTY_TEXT_OVERVIEW_LENGTH
			? value.substring(0, MAX_PROPERTY_TEXT_OVERVIEW_LENGTH - 3) + '...'
			: value}

	<AdaptiveWrapper
		bind:open={wrapperState.isOpen}
		floatingAlign="start"
		triggerClass={buttonClass}
		floatingClass={tm(
			'w-full max-w-lg p-1',
			value && value.length < MAX_PROPERTY_TEXT_OVERVIEW_LENGTH && 'max-w-xs'
		)}
	>
		{#snippet trigger()}
			{@render tooltipWrapper(content)}
		{/snippet}

		<form class="space-y-0.5">
			<label for={property.id} class={labelClass}> {property.name} </label>

			<textarea
				use:textareaAutoSize
				id={property.id}
				name={property.name}
				placeholder="Empty"
				class="textarea textarea-ghost"
				{value}
				maxlength={MAX_PROPERTY_TEXT_LENGTH}
				oninput={handleOnInput}
				onkeypress={handleEnterKeypress}
			></textarea>
		</form>
	</AdaptiveWrapper>
{:else if property.type === 'NUMBER' && (value || isTableView())}
	<AdaptiveWrapper bind:open={wrapperState.isOpen} floatingAlign="start" triggerClass={buttonClass}>
		{#snippet trigger()}
			{@render tooltipWrapper(value)}
		{/snippet}

		<form class="space-y-0.5">
			<label for={property.id} class={labelClass}>
				{property.name}
			</label>

			<input
				id={property.id}
				name={property.name}
				placeholder="Empty"
				class="w-full input input-ghost input-sm px-1 font-semibold text-sm"
				type="text"
				inputmode="numeric"
				{value}
				maxlength={MAX_PROPERTY_NUMERIC_LENGTH}
				oninput={handleOnInput}
				onkeypress={handleEnterKeypress}
			/>
		</form>
	</AdaptiveWrapper>
{:else if value || isTableView()}
	<AdaptiveWrapper bind:open={wrapperState.isOpen} floatingAlign="start" triggerClass={buttonClass}>
		{#snippet trigger()}
			{@render tooltipWrapper(value)}
		{/snippet}

		<form class="space-y-0.5">
			<label for={property.id} class={labelClass}>
				{property.name}
			</label>

			<input
				id={property.id}
				name={property.name}
				placeholder="Empty"
				class="w-full input input-ghost px-1 font-semibold text-sm"
				type={property.type.toLowerCase()}
				{value}
				oninput={handleOnInput}
			/>
		</form>
	</AdaptiveWrapper>
{/if}

{#snippet tooltipWrapper(content: string, isWrappered: boolean = false)}
	{@const tooltipId = useId(`property-tooltip-${property.id}-`)}
	{@const wrapperClass = tm(
		isWrappered && 'h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold',
		isWrappered && PROPERTY_COLORS[color]
	)}

	<span id={tooltipId} class={wrapperClass}>
		{content}
	</span>

	{@render tooltipContent(tooltipId)}
{/snippet}

{#snippet tooltipContent(id: string)}
	{#if !isTableView()}
		<Tooltip triggerBy={id}>
			<div class="flex items-center p-1 gap-x-1.5">
				<PropertyIcon key={property.type} class="size-4" />
				<span class="text-sm font-semibold">{property.name}</span>
			</div>
		</Tooltip>
	{/if}
{/snippet}

{#snippet clearBtn()}
	<HSeparator />
	<Button
		theme="ghost"
		class="h-8 w-full font-semibold justify-start"
		disabled={value === ''}
		onclick={() => {
			updPropertyRef('');
			wrapperState.close();
		}}
	>
		<Eraser />

		Clear
	</Button>
{/snippet}
