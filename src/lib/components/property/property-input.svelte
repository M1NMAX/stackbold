<script lang="ts">
	import Eraser from 'lucide-svelte/icons/eraser';
	import type { Property } from '@prisma/client';
	import { getLocalTimeZone, parseDate } from '@internationalized/date';
	import {
		DEBOUNCE_INTERVAL,
		MAX_PROPERTY_NUMERIC_LENGTH,
		MAX_PROPERTY_TEXT_LENGTH,
		PROPERTY_COLORS
	} from '$lib/constant';
	import { tm, sanitizeNumberInput } from '$lib/utils';
	import { getItemState } from '$lib/components/items';
	import debounce from 'debounce';
	import { textareaAutoSize } from '$lib/actions';
	import { fullDateFormat, ModalState } from '$lib/states/index.js';
	import { getOption, getPropertyColor, getPropertyRef } from './index.js';
	import {
		AdaptiveWrapper,
		Button,
		Calendar,
		Select,
		Label,
		HSeparator,
		buttonVariants
	} from '$lib/components/base/index.js';

	type Props = {
		property: Property;
		itemId: string;
	};

	let { property, itemId }: Props = $props();

	const itemState = getItemState();

	let value = $derived(getPropertyValue());
	let color = $derived(getPropertyColor(property, value));
	let isFocus = $state(false);

	let wrapperState = new ModalState();

	const updPropertyRefDebounced = debounce(updPropertyRef, DEBOUNCE_INTERVAL);
	async function updPropertyRef(ref: { id: string; value: string }) {
		await itemState.updPropertyRef(itemId, ref);
	}

	const updTargetElValue = debounce(function (target: HTMLInputElement, value: string) {
		target.value = value;
	}, DEBOUNCE_INTERVAL);

	// TODO: Input validation
	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;
		let value = targetEl.value;

		if (property.type === 'NUMBER') {
			value = sanitizeNumberInput(targetEl.value);
			updTargetElValue(targetEl, value);
		} else if (targetEl.type === 'checkbox') {
			value = targetEl.checked.toString();
		}

		updPropertyRefDebounced({ id: property.id, value });
	}

	function onClickClear() {
		updPropertyRef({ id: property.id, value: '' });
		wrapperState.close();
	}

	// utils
	function getPropertyValue() {
		const item = itemState.getItem(itemId);
		if (!item) return '';

		const propertyRef = getPropertyRef(item.properties, property.id);

		if (!propertyRef) return '';
		if (property.type !== 'SELECT') return propertyRef.value;

		const option = getOption(property.options, propertyRef.value);
		return option ? option.id : '';
	}

	function handleFocusIn() {
		isFocus = true;
	}
	function handleFocusOut() {
		isFocus = false;
	}

	//FIXME:
	function onOpenChange(open: boolean) {
		isFocus = open;
	}
</script>

{#if property.type === 'CHECKBOX'}
	<div
		class={[
			'flex justify-between items-center py-1 px-1.5 gap-x-1 rounded-sm bg-secondary text-secondary-foreground'
		]}
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
	<div class={['pb-1 rounded-sm text-secondary-foreground bg-secondary']}>
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
			onselect={(opt) => updPropertyRef({ id: property.id, value: opt.id })}
			placeholder="Empty"
		/>
	</div>
{:else if property.type === 'DATE'}
	<div class={['rounded-sm text-secondary-foreground bg-secondary']}>
		<Label for={property.id} name={property.name} icon={property.type.toLowerCase()} />
		<AdaptiveWrapper
			bind:open={wrapperState.isOpen}
			floatingAlign="start"
			triggerClass={buttonVariants({
				theme: 'ghost',
				className: 'w-full justify-start p-1 bg-transparent hover:bg-transparent'
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
					updPropertyRef({ id: property.id, value: dt.toString() });
					wrapperState.close();
				}}
			/>
			{@render clearBtn()}
		</AdaptiveWrapper>
	</div>
{:else}
	<div class={['px-1 rounded-sm text-secondary-foreground bg-secondary']}>
		<Label
			for={property.id}
			name={property.name}
			icon={property.type.toLowerCase()}
			class="py-1 px-0.5"
		/>

		{#if property.type === 'TEXT'}
			<textarea
				use:textareaAutoSize
				id={property.id}
				name={property.name}
				{value}
				maxlength={MAX_PROPERTY_TEXT_LENGTH}
				oninput={handleOnInput}
				onfocusin={handleFocusIn}
				onfocusout={handleFocusOut}
				class="ghost-textarea"
			></textarea>
		{:else if property.type === 'NUMBER'}
			<input
				id={property.id}
				type="text"
				inputmode="numeric"
				{value}
				maxlength={MAX_PROPERTY_NUMERIC_LENGTH}
				oninput={handleOnInput}
				onfocusin={handleFocusIn}
				onfocusout={handleFocusOut}
				class="ghost-input"
			/>
		{:else}
			<input
				id={property.id}
				type={property.type.toLowerCase()}
				{value}
				oninput={handleOnInput}
				onfocusin={handleFocusIn}
				onfocusout={handleFocusOut}
				maxlength={MAX_PROPERTY_TEXT_LENGTH}
				class="ghost-input"
			/>
		{/if}
	</div>
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

<style>
	.ghost-input {
		@apply h-9 w-full flex p-1 rounded-sm border-0 bg-transparent text-base ring-offset-background file:border-0 file:bg-transparent file:text-foreground file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;

		&:focus,
		&:focus-within {
			@apply outline-none;
			box-shadow: none;
		}
	}

	.ghost-textarea {
		@apply resize-none w-full flex p-1 rounded-sm border-0 bg-transparent  text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50;

		&:focus,
		&:focus-within {
			@apply outline-none;
			box-shadow: none;
		}
	}
</style>
