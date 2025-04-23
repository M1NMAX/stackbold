<script lang="ts">
	import Eraser from 'lucide-svelte/icons/eraser';
	import type { Property } from '@prisma/client';
	import { getLocalTimeZone, parseAbsolute, parseDate } from '@internationalized/date';
	import {
		DEBOUNCE_INTERVAL,
		MAX_PROPERTY_NUMERIC_LENGTH,
		MAX_PROPERTY_TEXT_LENGTH,
		MIN_SEARCHABLE_PROPERTY_SELECT,
		PROPERTY_COLORS
	} from '$lib/constant/index.js';
	import { tm, sanitizeNumberInput } from '$lib/utils';
	import debounce from 'debounce';
	import { textareaAutoSize } from '$lib/actions';
	import { fullDateFormat, fullDateTimeFormat, ModalState } from '$lib/states/index.js';
	import {
		separeteMultiselectOptions,
		getPropertyColor,
		joinMultiselectOptions,
		isNumerical
	} from './index.js';
	import {
		AdaptiveWrapper,
		Button,
		Calendar,
		Select,
		Label,
		HSeparator,
		buttonVariants,
		Field
	} from '$lib/components/base/index.js';

	type Props = {
		property: Property;
		onchange: (value: string) => void;
		value?: string;
	};

	let { property, onchange, value = '' }: Props = $props();

	let color = $derived(getPropertyColor(property, value));
	let wrapperState = new ModalState();

	const onchangeDebounced = debounce((v: string) => onchange(v), DEBOUNCE_INTERVAL);
	const updTargetElValue = debounce(updInputEl, DEBOUNCE_INTERVAL);

	function updInputEl(target: HTMLInputElement, value: string) {
		target.value = value;
	}

	// TODO: Input validation
	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;
		let value = targetEl.value;

		if (isNumerical(property.type)) {
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
</script>

{#if property.type === 'CHECKBOX'}
	<div
		class="flex justify-between items-center py-1 px-1.5 gap-x-1 rounded-sm bg-secondary text-secondary-foreground"
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
{:else if property.type === 'SELECT'}
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
{:else if property.type === 'MULTISELECT'}
	{@const selectedOptions = separeteMultiselectOptions(value)}
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
{:else if property.type === 'DATE'}
	<Field>
		<Label for={property.id} name={property.name} icon={property.type.toLowerCase()} />
		<AdaptiveWrapper
			bind:open={wrapperState.isOpen}
			floatingAlign="start"
			triggerClass={buttonVariants({
				theme: 'ghost',
				variant: 'menu',
				className: 'w-full justify-start bg-transparent hover:bg-transparent'
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
{:else if property.type === 'CREATED'}
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
{:else}
	<Field>
		<Label for={property.id} name={property.name} icon={property.type.toLowerCase()} />

		{#if property.type === 'TEXT'}
			<textarea
				use:textareaAutoSize
				id={property.id}
				name={property.name}
				{value}
				maxlength={MAX_PROPERTY_TEXT_LENGTH}
				oninput={handleOnInput}
				class="textarea textarea-ghost"
			></textarea>
		{:else if property.type === 'NUMBER'}
			<input
				id={property.id}
				type="text"
				inputmode="numeric"
				{value}
				maxlength={MAX_PROPERTY_NUMERIC_LENGTH}
				oninput={handleOnInput}
				class="input input-ghost"
			/>
		{:else}
			<input
				id={property.id}
				type={property.type.toLowerCase()}
				{value}
				oninput={handleOnInput}
				maxlength={MAX_PROPERTY_TEXT_LENGTH}
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
