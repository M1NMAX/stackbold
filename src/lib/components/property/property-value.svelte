<script lang="ts">
	import { DEBOUNCE_INTERVAL, PROPERTY_COLORS } from '$lib/constant';
	import type { Property } from '@prisma/client';
	import { CalendarIcon, Check } from 'lucide-svelte';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { cn } from '$lib/utils';
	import { Calendar } from '$lib/components/ui/calendar';
	import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import {
		getOption,
		getPropertyColor,
		getPropertyRef,
		PropertyResponsiveWrapper,
		PropertyValueWrapper
	} from '.';
	import { getScreenState } from '$lib/components/view';
	import { getItemState } from '$lib/components/items';
	import debounce from 'debounce';
	import { textareaAutoSize } from '$lib/actions';

	type Props = {
		itemId: string;
		property: Property;
		isTableView?: boolean;
	};

	let { itemId, property, isTableView = false }: Props = $props();

	const itemState = getItemState();
	const isDesktop = getScreenState();

	let open = $state(false);

	let value = $derived(getPropertyValue());
	let color = $derived(getPropertyColor(property, value));

	const updPropertyRefDebounced = debounce(updPropertyRef, DEBOUNCE_INTERVAL);
	async function updPropertyRef(value: string) {
		if (shouldClose()) open = false;
		await itemState.updPropertyRef(itemId, { id: property.id, value });
	}

	function handleOnInput(e: Event) {
		// TODO: add validation
		const input = e.target as HTMLInputElement;
		const currValue = input.type === 'checkbox' ? input.checked.toString() : input.value;
		updPropertyRefDebounced(currValue);
	}

	const buttonClass = $derived(
		cn(
			'w-full justify-start py-2 px-1 rounded-none border-0 bg-inherit hover:bg-inherit',
			property.type === 'NUMBER' && 'justify-end',
			!isTableView && 'h-6 w-fit rounded outline-none  py-1 px-1.5 font-semibold',
			!isTableView && PROPERTY_COLORS[color]
		)
	);

	const labelClass = cn('font-semibold text-sm px-0 pb-0.5 ', $isDesktop && 'sr-only');

	//uitls
	function getPropertyValue() {
		const item = itemState.getItem(itemId);
		if (!item) return '';

		const propertyRef = getPropertyRef(item.properties, property.id);

		if (!propertyRef) return '';
		if (property.type !== 'SELECT') return propertyRef.value;

		const option = getOption(property.options, propertyRef.value);
		return option ? option.id : '';
	}

	function shouldClose() {
		return open && (property.type === 'SELECT' || property.type === 'DATE');
	}
</script>

{#if property.type === 'CHECKBOX'}
	<label
		class={cn(
			'flex justify-center',
			!isTableView &&
				'inline-flex items-center justify-center space-x-1 py-0.5 px-1 rounded text-sm font-semibold',
			!isTableView && PROPERTY_COLORS[color]
		)}
	>
		<input type="checkbox" checked={value === 'true'} oninput={handleOnInput} class="checkbox" />

		<span class={cn('font-semibold', isTableView && 'sr-only')}>{property.name} </span>
	</label>
{:else if property.type === 'SELECT' && (value || isTableView)}
	{@const selected = getOption(property.options, value)?.value ?? ''}

	<PropertyResponsiveWrapper
		bind:open
		btnClass={buttonClass}
		mobileClass="p-2"
		desktopClass="w-full max-w-48 p-1"
	>
		{#snippet header()}
			<PropertyValueWrapper isWrappered={!!value && isTableView} class={PROPERTY_COLORS[color]}>
				{selected}
			</PropertyValueWrapper>
		{/snippet}

		<div>
			<p class={labelClass}>{property.name}</p>
			<RadioGroup.Root value={value || undefined} class="gap-y-0">
				{#each property.options as option}
					<Label
						for={option.id}
						class="w-full flex items-center space-x-1.5 py-1.5 px-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
					>
						<span class={cn('size-4 rounded-sm', PROPERTY_COLORS[option.color])}></span>
						<span class="grow text-sm font-semibold">
							{option.value}
						</span>

						<Check class={cn('icon-xs', value !== option.id && 'text-transparent')} />
						<RadioGroup.Item
							value={option.id}
							id={option.id}
							class="sr-only"
							on:click={() => updPropertyRef(option.id)}
						/>
					</Label>
				{/each}
				<RadioGroup.Input name="spacing" />
			</RadioGroup.Root>
		</div>
	</PropertyResponsiveWrapper>
{:else if property.type === 'DATE' && (value || isTableView)}
	<!--js current date need some adjustiments based on  https://stackoverflow.com/a/10211214 -->
	{@const plus = value ? 0 : 1}
	{@const valueAsDate = value ? new Date(value) : new Date()}
	{@const df = new DateFormatter('en-US', { dateStyle: 'long' })}

	<PropertyResponsiveWrapper bind:open btnClass={buttonClass} desktopClass="w-auto p-0">
		{#snippet header()}
			{#if value}
				<PropertyValueWrapper isWrappered={!!value && isTableView} class={PROPERTY_COLORS['GRAY']}>
					<CalendarIcon class="icon-xs mr-2" />
					{df.format(
						new CalendarDate(
							valueAsDate.getFullYear(),
							valueAsDate.getMonth(),
							valueAsDate.getDate()
						).toDate(getLocalTimeZone())
					)}
				</PropertyValueWrapper>
			{/if}
		{/snippet}

		<p class={cn(labelClass, 'text-center py-1')}>{property.name}</p>
		<div class="w-full max-w-xs mx-auto px-6 md:px-4 pb-2">
			<Calendar
				value={new CalendarDate(
					valueAsDate.getFullYear(),
					valueAsDate.getMonth() + plus,
					valueAsDate.getDate()
				)}
				onValueChange={(dt) => {
					if (!dt) return;
					updPropertyRef(dt.toString());
				}}
				class="p-0"
			/>
		</div>
	</PropertyResponsiveWrapper>
{:else if property.type === 'TEXT' && (value || isTableView)}
	{@const MAX_STR_LENGTH = 50}
	<PropertyResponsiveWrapper
		bind:open
		btnClass={buttonClass}
		mobileClass="p-2"
		desktopClass={cn('w-full max-w-lg', value && value?.length < MAX_STR_LENGTH && 'max-w-xs')}
	>
		{#snippet header()}
			{value?.substring(0, MAX_STR_LENGTH)}
			{value && value.length > MAX_STR_LENGTH ? '...' : ''}
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
				oninput={handleOnInput}
			></textarea>
		</form>
	</PropertyResponsiveWrapper>
{:else if property.type === 'NUMBER' && (value || isTableView)}
	<PropertyResponsiveWrapper bind:open btnClass={buttonClass} mobileClass="p-2">
		{#snippet header()}
			{value}
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
				type="number"
				step="any"
				{value}
				oninput={handleOnInput}
			/>
		</form>
	</PropertyResponsiveWrapper>
{:else if value || isTableView}
	<PropertyResponsiveWrapper bind:open btnClass={buttonClass}>
		{#snippet header()}
			{value}
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
	</PropertyResponsiveWrapper>
{/if}
