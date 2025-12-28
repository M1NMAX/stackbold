<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import Eraser from 'lucide-svelte/icons/eraser';
	import { PropertyType, type Property } from '@prisma/client';
	import { getLocalTimeZone, parseAbsolute, parseDate } from '@internationalized/date';
	import {
		DEBOUNCE_INTERVAL,
		DEFAULT_COPY_TO_CLIPBOARD_MESSAGE,
		MAX_PROPERTY_NUMERIC_LENGTH,
		MAX_PROPERTY_TEXT_LENGTH,
		MIN_SEARCHABLE_PROPERTY_SELECT,
		PROPERTIES_THAT_USE_INPUT,
		PROPERTY_COLORS
	} from '$lib/constant/index.js';
	import { tm, sanitizeNumberInput, useId } from '$lib/utils/index.js';
	import debounce from 'debounce';
	import {
		fullDateFormat,
		fullDateTimeFormat,
		getToastState,
		ModalState
	} from '$lib/states/index.js';
	import {
		separateMultiselectOptions,
		getPropertyColor,
		joinMultiselectOptions,
		isPropertyNumerical,
		PropertyFile,
		PropertyIcon
	} from './index.js';
	import {
		AdaptiveWrapper,
		Button,
		Calendar,
		Select,
		Label,
		HSeparator,
		buttonVariants,
		Field,
		TextareaAutosize,
		Tooltip
	} from '$lib/components/base/index.js';

	type Props = {
		property: Property;
		onchange: (value: string) => void;
		value: string;
		itemId: string;
	};

	let { property, onchange, value, itemId }: Props = $props();

	let color = $derived(getPropertyColor(property, value));
	let wrapperState = new ModalState();

	const toastState = getToastState();

	const onchangeDebounced = debounce((v: string) => onchange(v), DEBOUNCE_INTERVAL);
	const updTargetElValue = debounce(updInputEl, DEBOUNCE_INTERVAL);

	function updInputEl(target: HTMLInputElement, value: string) {
		target.value = value;
	}

	// TODO: Input validation
	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;
		let value = targetEl.value;

		if (isPropertyNumerical(property)) {
			value = sanitizeNumberInput(targetEl.value);
			updTargetElValue(targetEl, value);
		} else if (targetEl.type === 'checkbox') {
			value = targetEl.checked.toString();
		}
		onchangeDebounced(value);
	}

	function onClickClear() {
		onchange('');
		wrapperState.close();
	}

	function copyValueToClipboard() {
		if (!PROPERTIES_THAT_USE_INPUT.includes(property.type) && !value) return;
		navigator.clipboard.writeText(value);
		toastState.success(DEFAULT_COPY_TO_CLIPBOARD_MESSAGE);
	}
</script>

{#if property.type === PropertyType.CHECKBOX}
	<div
		class="flex justify-between items-center py-1 px-1.5 gap-x-1 rounded-md bg-secondary text-secondary-foreground"
	>
		<input
			id={property.id}
			type="checkbox"
			checked={value === 'true'}
			oninput={handleOnInput}
			class="checkbox"
		/>
		<Label for={property.id} name={property.name} compact />
	</div>
{:else if property.type === PropertyType.SELECT}
	<Field>
		<Label for={property.id} name={property.name} icon={property.type.toLowerCase()} />
		<Select
			id={property.id}
			options={[
				...property.options.map((option) => ({
					id: option.id,
					label: option.value,
					isSelected: option.id === value,
					theme: PROPERTY_COLORS[option.color]
				}))
			]}
			onselect={(opt) => onchange(opt.id)}
			placeholder="Empty"
			searchable={property.options.length >= MIN_SEARCHABLE_PROPERTY_SELECT}
		/>
	</Field>
{:else if property.type === PropertyType.MULTISELECT}
	{@const selectedOptions = separateMultiselectOptions(value)}
	<Field>
		<Label for={property.id} name={property.name} icon={property.type.toLowerCase()} />
		<Select
			id={property.id}
			options={[
				...property.options.map((option) => ({
					id: option.id,
					label: option.value,
					isSelected: selectedOptions.includes(option.id),
					theme: PROPERTY_COLORS[option.color]
				}))
			]}
			onselect={(opts) => onchange(joinMultiselectOptions(opts))}
			placeholder="Empty"
			searchable={property.options.length >= MIN_SEARCHABLE_PROPERTY_SELECT}
			isMulti
		/>
	</Field>
{:else if property.type === PropertyType.RELATION}
	{@const selectedOptions = separateMultiselectOptions(value)}
	<Field>
		<Label for={property.id} name={property.name} icon={property.type.toLowerCase()} />
		<Select
			id={property.id}
			options={[
				...property.options.map((option) => ({
					id: option.id,
					label: option.value,
					theme: PROPERTY_COLORS[option.color],
					icon: 'item',
					isSelected: selectedOptions.includes(option.id)
				}))
			]}
			onselect={(opts) => onchange(joinMultiselectOptions(opts))}
			placeholder="Empty"
			searchable
			isMulti
		/>
	</Field>
{:else if property.type === PropertyType.BUNDLE}
	<Field>
		<Label for={property.id} name={property.name} icon={property.type.toLowerCase()} />
		<div
			class={buttonVariants({
				theme: 'ghost',
				className: 'bg-transparent'
			})}
		>
			{#if value}
				{@render miniWrapper(value)}
			{/if}
		</div>
	</Field>
{:else if property.type === PropertyType.DATE}
	<Field>
		<Label for={property.id} name={property.name} icon={property.type.toLowerCase()} />
		<AdaptiveWrapper
			bind:open={wrapperState.isOpen}
			floatingAlign="start"
			triggerClass={buttonVariants({
				theme: 'ghost',
				variant: 'menu',
				className: 'bg-transparent'
			})}
		>
			{#snippet trigger()}
				{#if value}
					{@const formatted = fullDateFormat(parseDate(value).toDate(getLocalTimeZone()))}
					{@render miniWrapper(formatted)}
				{/if}
			{/snippet}

			<Calendar
				value={value ? parseDate(value) : undefined}
				onchange={(dt) => {
					onchange(dt.toString());
					wrapperState.close();
				}}
			/>
			{@render clearBtn()}
		</AdaptiveWrapper>
	</Field>
{:else if property.type === PropertyType.CREATED}
	{@const formatted = fullDateTimeFormat(parseAbsolute(value, getLocalTimeZone()).toDate())}
	<Field>
		<Label for={property.id} name={property.name} icon={property.type.toLowerCase()} />
		<div
			class={buttonVariants({
				theme: 'ghost',
				className: 'w-full justify-start bg-transparent hover:bg-transparent'
			})}
		>
			{@render miniWrapper(formatted)}
		</div>
	</Field>
{:else if property.type === PropertyType.FILE}
	<Field>
		<Label for={property.id} name={property.name} icon={property.type.toLowerCase()} />
		<PropertyFile {property} {value} {itemId} />
	</Field>
{:else if property.type === PropertyType.URL}
	{@const tooltipId = useId(`property-url-copy-btn-tooltip-${property.id}-value-${itemId}`)}
	<Field>
		<Label for={property.id} icon={property.type.toLowerCase()} class="justify-between">
			<PropertyIcon key={property.type} />
			<span class="grow font-semibold text-sm"> {property.name} </span>
			{#if value}
				<Button id={tooltipId} theme="secondary" variant="cicon" onclick={copyValueToClipboard}>
					<Copy />
				</Button>
				<Tooltip triggerBy={tooltipId}>Copy Url</Tooltip>
			{/if}
		</Label>
		<input
			id={property.id}
			type={property.type.toLowerCase()}
			{value}
			oninput={handleOnInput}
			maxlength={MAX_PROPERTY_TEXT_LENGTH}
			class="input input-ghost"
		/>
	</Field>
{:else}
	<Field>
		<Label for={property.id} name={property.name} icon={property.type.toLowerCase()} />

		{#if property.type === PropertyType.TEXT}
			<TextareaAutosize
				id={property.id}
				name={property.name}
				{value}
				maxlength={MAX_PROPERTY_TEXT_LENGTH}
				oninput={handleOnInput}
				ghost
			></TextareaAutosize>
		{:else if property.type === PropertyType.NUMBER}
			<input
				id={property.id}
				type="text"
				inputmode="numeric"
				{value}
				maxlength={MAX_PROPERTY_NUMERIC_LENGTH}
				oninput={handleOnInput}
				class="input input-ghost"
			/>
		{/if}
	</Field>
{/if}

{#snippet miniWrapper(content: string)}
	{@const wrapperClass = tm(
		'h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold',
		PROPERTY_COLORS[color]
	)}

	<span class={wrapperClass}>
		{content}
	</span>
{/snippet}

{#snippet clearBtn()}
	<HSeparator class="my-0.5" />
	<Button
		theme="ghost"
		disabled={value === ''}
		onclick={onClickClear}
		class="h-8 w-full font-semibold justify-start"
	>
		<Eraser />

		Clear
	</Button>
{/snippet}
