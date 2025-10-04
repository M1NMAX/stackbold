<script lang="ts">
	import Eraser from 'lucide-svelte/icons/eraser';
	import {
		DEBOUNCE_INTERVAL,
		MAX_PROPERTY_NUMERIC_LENGTH,
		MAX_PROPERTY_TEXT_LENGTH,
		MAX_PROPERTY_TEXT_OVERVIEW_LENGTH,
		MIN_SEARCHABLE_PROPERTY_SELECT,
		PROPERTIES_THAT_USE_INPUT,
		PROPERTIES_THAT_USE_SELECTOR,
		PROPERTY_COLORS
	} from '$lib/constant/index.js';
	import { type Item, type Property, PropertyType, type View, ViewType } from '@prisma/client';
	import { tm, sanitizeNumberInput, useId } from '$lib/utils/index.js';
	import { getLocalTimeZone, parseAbsolute, parseDate } from '@internationalized/date';
	import {
		getPropertyColor,
		isPropertyNumerical,
		joinMultiselectOptions,
		PropertyIcon,
		separateMultiselectOptions,
		getRefValue
	} from './index.js';
	import { getItemState } from '$lib/components/items/index.js';
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
		view: View;
		property: Property;
		item: Item;
	};

	let { item, property, view }: Props = $props();

	const itemState = getItemState();

	let wrapperState = new ModalState();

	let value = $derived(getRefValue(item.properties, property.id));
	let color = $derived(getPropertyColor(property, value));

	const updPropertyRefDebounced = debounce(updPropertyRef, DEBOUNCE_INTERVAL);
	async function updPropertyRef(value: string) {
		if (shouldClose()) wrapperState.close();
		await itemState.updPropertyRef(item.id, { id: property.id, value }, shouldRefresh());
	}

	const updTargetElValue = debounce(function (target: HTMLInputElement, value: string) {
		target.value = value;
	}, DEBOUNCE_INTERVAL);

	async function handleOnInput(e: Event) {
		// TODO: add validation
		const targetEl = e.target as HTMLInputElement;

		let value = targetEl.value;
		if (isPropertyNumerical(property)) {
			value = sanitizeNumberInput(targetEl.value);
			updTargetElValue(targetEl, value);
		}
		await updPropertyRefDebounced(value);
	}

	async function handleCheckbox(e: Event) {
		const targetEl = e.target as HTMLInputElement;
		if (targetEl.type !== 'checkbox') return;

		await updPropertyRef(targetEl.checked.toString());
	}

	async function handleEnterKeypress(e: KeyboardEvent) {
		//TODO: verify what whould happen on mobile if the user press the Enter key
		if (e.key !== 'Enter') return;
		e.preventDefault();
		const targetEl = e.target as HTMLInputElement;
		const value = isPropertyNumerical(property)
			? sanitizeNumberInput(targetEl.value)
			: targetEl.value;

		wrapperState.close();
		await updPropertyRef(value);
	}

	const buttonClass = $derived(
		tm(
			isTableView()
				? 'w-full justify-start  rounded-none border-0 bg-transparent hover:bg-transparent'
				: 'w-fit h-6 md:h-6 p-2 rounded-sm font-semibold hover:bg-current/90 hover:text-white',
			isPropertyNumerical(property) && 'justify-end',
			useSelector(property.type) && 'px-0',
			!useSelector(property.type) && !isTableView() && `${PROPERTY_COLORS['GRAY']}`
		)
	);

	const labelClass = tm('md:sr-only block font-semibold text-sm text-center px-0 py-1 select-none');

	//utils
	function shouldClose() {
		return wrapperState.isOpen && property.type === PropertyType.DATE;
	}

	function isTableView() {
		return view.type === ViewType.TABLE;
	}

	function useInputField(type: PropertyType) {
		return PROPERTIES_THAT_USE_INPUT.includes(type);
	}

	function useSelector(type: PropertyType) {
		return PROPERTIES_THAT_USE_SELECTOR.includes(type);
	}

	function shouldRefresh() {
		return (
			view.groupBy === property.id ||
			view.sorts.some((s) => s.field === property.id) ||
			view.filters.some((f) => f.id === property.id)
		);
	}

	$effect(() => {
		if (wrapperState.isOpen && useInputField(property.type)) {
			const inputEl = document.getElementById(property.id) as HTMLInputElement;
			tick().then(() => inputEl.focus());
		}
	});
</script>

{#if property.type === PropertyType.CHECKBOX}
	<label
		class={tm(
			'flex justify-center',
			!isTableView() &&
				'inline-flex items-center justify-center space-x-1 py-0.5 px-1 rounded-sm text-sm font-semibold',
			!isTableView() && PROPERTY_COLORS[color]
		)}
	>
		<input type="checkbox" checked={value === 'true'} onchange={handleCheckbox} class="checkbox" />

		<span class={tm('font-semibold', isTableView() && 'sr-only')}>{property.name} </span>
	</label>
{:else if property.type === PropertyType.SELECT && (value || isTableView())}
	<Select
		id={`${property.id}-value-${item.id}`}
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

	{@render tooltipContent(`select-trigger-${property.id}-value-${item.id}`)}
{:else if property.type === PropertyType.MULTISELECT && (value || isTableView())}
	{@const selectedOptions = separateMultiselectOptions(value)}
	<Select
		id={`${property.id}-value-${item.id}`}
		options={[
			...property.options.map((option) => ({
				id: option.id,
				label: option.value,
				theme: PROPERTY_COLORS[option.color],
				isSelected: selectedOptions.includes(option.id)
			}))
		]}
		onselect={(options) => updPropertyRef(joinMultiselectOptions(options))}
		searchable={property.options.length >= MIN_SEARCHABLE_PROPERTY_SELECT}
		triggerClass={buttonClass}
		placeholder=""
		isMulti
	/>

	{@render tooltipContent(`select-trigger-${property.id}-value-${item.id}`)}
{:else if property.type === PropertyType.RELATION && (value || isTableView())}
	{@const selectedOptions = separateMultiselectOptions(value)}
	<Select
		id={`${property.id}-value-${item.id}`}
		options={[
			...property.options.map((option) => ({
				id: option.id,
				label: option.value,
				theme: PROPERTY_COLORS[option.color],
				icon: 'item',
				isSelected: selectedOptions.includes(option.id)
			}))
		]}
		onselect={(opts) => updPropertyRef(joinMultiselectOptions(opts))}
		triggerClass={buttonClass}
		placeholder=""
		searchable
		isMulti
	/>

	{@render tooltipContent(`select-trigger-${property.id}-value-${item.id}`)}
{:else if property.type === PropertyType.BUNDLE && (value || isTableView())}
	<div class={buttonVariants({ theme: 'ghost', className: buttonClass })}>
		{@render tooltipWrapper(value, !!value && isTableView())}
	</div>
{:else if property.type === PropertyType.DATE && (value || isTableView())}
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
{:else if property.type === PropertyType.CREATED}
	{@const formatted = fullDateTimeFormat(parseAbsolute(value, getLocalTimeZone()).toDate())}
	<div class={buttonVariants({ theme: 'ghost', className: buttonClass })}>
		{@render tooltipWrapper(formatted, !!value && isTableView())}
	</div>
{:else if property.type === PropertyType.TEXT && (value || isTableView())}
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
{:else if property.type === PropertyType.NUMBER && (value || isTableView())}
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
