<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import Eraser from 'lucide-svelte/icons/eraser';
	import {
		DEBOUNCE_INTERVAL,
		DEFAULT_COPY_TO_CLIPBOARD_MESSAGE,
		MAX_PROPERTY_LINK_OVERVIEW_LENGTH,
		MAX_PROPERTY_NUMERIC_LENGTH,
		MAX_PROPERTY_TEXT_LENGTH,
		MAX_PROPERTY_TEXT_OVERVIEW_LENGTH,
		MIN_SEARCHABLE_PROPERTY_SELECT,
		PROPERTIES_THAT_USE_INPUT,
		PROPERTIES_THAT_USE_SELECTOR,
		THEME_COLORS
	} from '$lib/constant/index.js';
	import {
		Color,
		PropertyType,
		ViewType,
		type Item,
		type Property,
		type View
	} from '@prisma/client';
	import {
		tm,
		useId,
		truncateDomain,
		truncateTextEnd,
		sanitizeNumbericInput,
		sanitizeNumber,
		formatNumber
	} from '$lib/utils/index.js';
	import { getLocalTimeZone, parseAbsolute, parseDate } from '@internationalized/date';
	import {
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
		Badge,
		Button,
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
	const wrapperState = new ModalState();

	let value = $derived(getRefValue(item.properties, property.id));

	const updPropertyRefDebounced = debounce(updPropertyRef, DEBOUNCE_INTERVAL);
	async function updPropertyRef(value: string) {
		if (shouldClose()) wrapperState.close();
		await itemState.updPropertyRef(item.id, { id: property.id, value }, shouldRefresh());
	}

	async function handleOnInput(e: Event) {
		// TODO: add validation
		const targetEl = e.target as HTMLInputElement;

		let value = targetEl.value;
		if (isPropertyNumerical(property)) {
			value = sanitizeNumbericInput(targetEl);
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
		const value = isPropertyNumerical(property) ? sanitizeNumber(targetEl.value) : targetEl.value;

		wrapperState.close();
		await updPropertyRef(value);
	}

	const buttonClass = $derived(
		tm(
			isTableView()
				? 'h-6 w-full p-0 justify-start rounded-none border-0 bg-transparent hover:bg-transparent'
				: 'h-6 w-fit p-0 rounded-md font-semibold hover:bg-current/90 hover:text-white',
			isPropertyNumerical(property) && 'justify-end',
			allowMultipleValues(property.type) && ' lg:h-6 p-0',
			hasUnifiedBgColor() && `${THEME_COLORS[Color.GRAY]}`,
			allowMultipleValues(property.type) && !isTableView() && 'bg-gray-200/40 dark:bg-gray-700/40'
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

	function allowMultipleValues(type: PropertyType) {
		return PROPERTIES_THAT_USE_SELECTOR.includes(type) || type === PropertyType.FILE;
	}

	function hasUnifiedBgColor() {
		return !isTableView() && !allowMultipleValues(property.type);
	}

	function shouldRefresh() {
		return (
			view.groupBy === property.id ||
			view.sorts.some((s) => s.field === property.id) ||
			view.filters.some((f) => f.id === property.id)
		);
	}

	function copyUrl() {
		if (!PROPERTIES_THAT_USE_INPUT.includes(property.type) && !value) return;
		navigator.clipboard.writeText(value);
		toastState.success(DEFAULT_COPY_TO_CLIPBOARD_MESSAGE);
	}

	$effect(() => {
		if (wrapperState.isOpen && PROPERTIES_THAT_USE_INPUT.includes(property.type)) {
			const inputEl = document.getElementById(property.id) as HTMLInputElement;
			tick().then(() => inputEl.focus());
		}
	});
</script>

{#if property.type === PropertyType.CREATED}
	{@const formatted = fullDateTimeFormat(parseAbsolute(value, getLocalTimeZone()).toDate())}
	{@render tooltipWrapper(formatted, false)}
{:else if property.type === PropertyType.BUNDLE && shouldShowTrigger()}
	{@const formatted = formatNumber(+value, property.format, property.decimals)}

	<div class={tm(isTableView() && 'w-full flex justify-end')}>
		{@render tooltipWrapper(formatted, false, !isTableView())}
	</div>
{:else if property.type === PropertyType.FILE && shouldShowTrigger()}
	{@const tooltipId = `property-file-trigger-${property.id}-value-${item.id}`}
	<PropertyFile {property} {value} itemId={item.id} id={tooltipId} {buttonClass} />

	{@render tooltipContent(tooltipId)}
{:else if property.type === PropertyType.CHECKBOX}
	<label
		class={tm(
			'flex justify-center',
			!isTableView() &&
				'inline-flex items-center justify-center gap-x-1.5 py-0.5 px-1 rounded-md text-sm font-semibold',
			!isTableView() && THEME_COLORS[Color.GRAY]
		)}
	>
		<input type="checkbox" class="checkbox" checked={value === 'true'} onchange={handleCheckbox} />

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
				theme: THEME_COLORS[option.color]
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
				theme: THEME_COLORS[option.color],
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
				theme: THEME_COLORS[option.color],
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
{:else if property.type === PropertyType.DATE && shouldShowTrigger()}
	<AdaptiveWrapper bind:open={wrapperState.isOpen} floatingAlign="start" triggerClass={buttonClass}>
		{#snippet trigger()}
			{#if value}
				{@const formatted = fullDateFormat(parseDate(value).toDate(getLocalTimeZone()))}
				{@render tooltipWrapper(formatted)}
			{/if}
		{/snippet}

		<p class={labelClass}>{property.name}</p>
		<Calendar
			value={value ? parseDate(value) : undefined}
			onchange={(dt) => updPropertyRef(dt.toString())}
		/>
		{@render clearBtn()}
	</AdaptiveWrapper>
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
			{@render tooltipWrapper(content, false, !isTableView())}
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
			{@const formatted = formatNumber(+value, property.format, property.decimals)}
			{@render tooltipWrapper(formatted, false, !isTableView())}
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
	{@const content = truncateDomain(value, MAX_PROPERTY_LINK_OVERVIEW_LENGTH)}
	<AdaptiveWrapper
		bind:open={wrapperState.isOpen}
		floatingAlign="start"
		triggerClass={buttonClass}
		floatingClass={tm(
			'w-full max-w-lg p-1',
			value && value.length < MAX_PROPERTY_LINK_OVERVIEW_LENGTH && 'max-w-xs'
		)}
	>
		{#snippet customTrigger({ id, toggle })}
			{@const copyBtnTooltipId = useId(`select-trigger-${property.id}-value-${item.id}`)}

			<div class={tm(buttonClass, 'flex items-center px-1')}>
				<button
					{id}
					onclick={() => toggle()}
					class={tm('w-full flex justify-start', value ? '' : 'h-full')}
				>
					{content}
				</button>
				{#if value}
					{#if !isTableView()}
						<span class="h-3 w-[1px] ml-2 bg-secondary-foreground"> </span>
					{/if}

					<button id={copyBtnTooltipId} onclick={copyUrl} class="ml-2">
						<Copy class="size-4" />
					</button>
					<Tooltip triggerBy={copyBtnTooltipId}>Copy</Tooltip>
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

{#snippet tooltipWrapper(content: string, isInteractive: boolean = true, hasBg: boolean = true)}
	{@const tooltipId = useId(`property-tooltip-${property.id}-`)}

	<Badge
		id={tooltipId}
		class={tm(
			'w-fit',
			!hasBg && 'bg-transparent dark:bg-transparent',
			isInteractive ? 'cursor-pointer' : 'cursor-default'
		)}
		color={isInteractive ? Color.GRAY : Color.SLATE}
	>
		{content}
	</Badge>
	{@render tooltipContent(tooltipId)}
{/snippet}

{#snippet tooltipContent(id: string)}
	{#if !isTableView()}
		<Tooltip triggerBy={id}>
			<PropertyIcon key={property.type} class="size-4" />
			<span>{property.name}</span>
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
