<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
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
	import {
		Color,
		type Item,
		type Property,
		PropertyType,
		type View,
		ViewType
	} from '@prisma/client';
	import {
		tm,
		sanitizeNumberInput,
		useId,
		truncateDomain,
		truncateTextEnd
	} from '$lib/utils/index.js';
	import { getLocalTimeZone, parseAbsolute, parseDate } from '@internationalized/date';
	import {
		getPropertyColor,
		isPropertyNumerical,
		joinMultiselectOptions,
		separateMultiselectOptions,
		getRefValue,
		PropertyIcon,
		PropertyFile
	} from './index.js';
	import { getItemState } from '$lib/components/item/index.js';
	import debounce from 'debounce';
	import {
		fullDateFormat,
		fullDateTimeFormat,
		getToastState,
		ModalState
	} from '$lib/states/index.js';
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		Calendar,
		HSeparator,
		Select,
		TextareaAutosize,
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
	const toastState = getToastState();

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
				? 'h-6 w-full justify-start rounded-none border-0 bg-transparent hover:bg-transparent'
				: 'h-6 w-fit p-2 rounded-md font-semibold hover:bg-current/90 hover:text-white',
			isPropertyNumerical(property) && 'justify-end',
			useSelector(property.type) && 'px-0 lg:h-6 py-0',
			hasUnifiedBgColor() && `${PROPERTY_COLORS[Color.GRAY]}`
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

	function shouldShowTrigger() {
		return value || isTableView();
	}

	function useSelector(type: PropertyType) {
		return PROPERTIES_THAT_USE_SELECTOR.includes(type);
	}

	function hasUnifiedBgColor() {
		return !isTableView() && !useSelector(property.type) && property.type !== PropertyType.FILE;
	}

	function shouldRefresh() {
		return (
			view.groupBy === property.id ||
			view.sorts.some((s) => s.field === property.id) ||
			view.filters.some((f) => f.id === property.id)
		);
	}

	function copyUrl() {
		if (property.type !== PropertyType.URL || !value) return;
		navigator.clipboard.writeText(value);
		toastState.success('Copied to clipboard');
	}

	$effect(() => {
		if (wrapperState.isOpen && PROPERTIES_THAT_USE_INPUT.includes(property.type)) {
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
				'inline-flex items-center justify-center space-x-1 py-0.5 px-1 rounded-md text-sm font-semibold',
			!isTableView() && PROPERTY_COLORS[color]
		)}
	>
		<input type="checkbox" checked={value === 'true'} onchange={handleCheckbox} class="checkbox" />

		<span class={tm('font-semibold', isTableView() && 'sr-only')}>{property.name} </span>
	</label>
{:else if property.type === PropertyType.SELECT && shouldShowTrigger()}
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
{:else if property.type === PropertyType.MULTISELECT && shouldShowTrigger()}
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
{:else if property.type === PropertyType.RELATION && shouldShowTrigger()}
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
{:else if property.type === PropertyType.DATE && shouldShowTrigger()}
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
{:else if property.type === PropertyType.TEXT && shouldShowTrigger()}
	{@const content = truncateTextEnd(value, MAX_PROPERTY_TEXT_OVERVIEW_LENGTH)}
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

			<TextareaAutosize
				{value}
				id={property.id}
				name={property.name}
				placeholder="Empty"
				maxlength={MAX_PROPERTY_TEXT_LENGTH}
				oninput={handleOnInput}
				onkeypress={handleEnterKeypress}
				ghost
			/>
		</form>
	</AdaptiveWrapper>
{:else if property.type === PropertyType.NUMBER && shouldShowTrigger()}
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
{:else if property.type === PropertyType.URL && shouldShowTrigger()}
	{@const content = truncateDomain(value, MAX_PROPERTY_TEXT_OVERVIEW_LENGTH)}
	<AdaptiveWrapper
		bind:open={wrapperState.isOpen}
		floatingAlign="start"
		triggerClass={buttonClass}
		floatingClass={tm(
			'w-full max-w-lg p-1',
			value && value.length < MAX_PROPERTY_TEXT_OVERVIEW_LENGTH && 'max-w-xs'
		)}
	>
		{#snippet customTrigger({ id, toggle })}
			{@const copyBtnTooltipId = useId(`select-trigger-${property.id}-value-${item.id}`)}

			<div class={tm(buttonClass, 'flex items-center gap-x-2')}>
				<button
					{id}
					onclick={() => toggle()}
					class={tm('flex justify-start', value ? '' : 'h-full')}
				>
					{content}
				</button>
				{#if value}
					<span class="h-3 w-[1.5px] bg-secondary-foreground"> </span>

					<button id={copyBtnTooltipId} onclick={copyUrl}>
						<Copy class="size-4" />
					</button>
					<Tooltip triggerBy={copyBtnTooltipId} class="p-1">Copy</Tooltip>
				{/if}
			</div>

			{@render tooltipContent(id)}
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
				type="url"
				{value}
				oninput={handleOnInput}
			/>
		</form>
	</AdaptiveWrapper>
{:else if property.type === PropertyType.FILE && shouldShowTrigger()}
	<PropertyFile buttonClass={tm(buttonClass, 'px-0')} {property} {value} itemId={item.id} />
{:else if shouldShowTrigger()}
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
