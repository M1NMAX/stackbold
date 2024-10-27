<script lang="ts">
	import { createTooltip, melt } from '@melt-ui/svelte';
	import { DEBOUNCE_INTERVAL, PROPERTY_COLORS } from '$lib/constant';
	import type { Property } from '@prisma/client';
	import { Check } from 'lucide-svelte';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { cn } from '$lib/utils';
	import { Calendar } from '$lib/components/ui/calendar';
	import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import {
		getOption,
		getPropertyColor,
		getPropertyRef,
		PropertyIcon,
		PropertyResponsiveWrapper
	} from '.';
	import { getScreenState } from '$lib/components/screen';
	import { getItemState } from '$lib/components/items';
	import debounce from 'debounce';
	import { textareaAutoSize } from '$lib/actions';
	import { ModalState } from '$lib/components/modal';
	import { fade } from 'svelte/transition';
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		itemId: string;
		property: Property;
		isTableView?: boolean;
	};

	let { itemId, property, isTableView = false }: Props = $props();

	const itemState = getItemState();
	const isDesktop = getScreenState();

	let wrapperState = new ModalState();

	let value = $derived(getPropertyValue());
	let color = $derived(getPropertyColor(property, value));

	const updPropertyRefDebounced = debounce(updPropertyRef, DEBOUNCE_INTERVAL);
	async function updPropertyRef(value: string) {
		if (shouldClose()) wrapperState.close();
		await itemState.updPropertyRef(itemId, { id: property.id, value });
	}

	function handleOnInput(e: Event) {
		// TODO: add validation
		const input = e.target as HTMLInputElement;
		const currValue = input.type === 'checkbox' ? input.checked.toString() : input.value;
		updPropertyRefDebounced(currValue);
	}

	async function handleEnterKeypress(e: KeyboardEvent) {
		//TODO: verify what whould happen on mobile if the user press the Enter key
		if (e.key !== 'Enter') return;
		e.preventDefault();
		const targetEl = e.target as HTMLInputElement;
		wrapperState.close();
		await updPropertyRef(targetEl.value);
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
		return wrapperState.isOpen && (property.type === 'SELECT' || property.type === 'DATE');
	}

	// tooltip
	const {
		elements: { trigger, content, arrow },
		states: { open }
	} = createTooltip({
		positioning: {
			placement: 'top'
		},
		openDelay: 0,
		closeDelay: 0,
		closeOnPointerDown: false
	});
</script>

{#if property.type === 'CHECKBOX'}
	<label
		class={cn(
			'flex justify-center',
			!isTableView &&
				'inline-flex items-center justify-center space-x-1 py-0.5 px-1 rounded-sm text-sm font-semibold',
			!isTableView && PROPERTY_COLORS[color]
		)}
	>
		<input type="checkbox" checked={value === 'true'} oninput={handleOnInput} class="checkbox" />

		<span class={cn('font-semibold', isTableView && 'sr-only')}>{property.name} </span>
	</label>
{:else if property.type === 'SELECT' && (value || isTableView)}
	{@const selected = getOption(property.options, value)?.value ?? ''}
	<PropertyResponsiveWrapper
		bind:open={wrapperState.isOpen}
		alignCenter={false}
		btnClass={buttonClass}
		mobileClass="p-2"
		desktopClass="w-full max-w-48 p-1"
	>
		{#snippet header()}
			{@render miniWrapper(selected, !!value && isTableView)}
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
			</RadioGroup.Root>
		</div>

		{@render clearBtn()}
	</PropertyResponsiveWrapper>
{:else if property.type === 'DATE' && (value || isTableView)}
	<!--js current date need some adjustiments based on  https://stackoverflow.com/a/10211214 -->
	{@const plus = value ? 0 : 1}
	{@const valueAsDate = value ? new Date(value) : new Date()}
	{@const df = new DateFormatter('en-US', { dateStyle: 'long' })}
	{@const content = df.format(
		new CalendarDate(
			valueAsDate.getFullYear(),
			valueAsDate.getMonth(),
			valueAsDate.getDate()
		).toDate(getLocalTimeZone())
	)}

	<PropertyResponsiveWrapper
		bind:open={wrapperState.isOpen}
		alignCenter={false}
		btnClass={buttonClass}
		desktopClass="w-auto p-0"
	>
		{#snippet header()}
			{#if value}
				{@render miniWrapper(content, !!value && isTableView)}
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
		{@render clearBtn()}
	</PropertyResponsiveWrapper>
{:else if property.type === 'TEXT' && (value || isTableView)}
	{@const MAX_LENGTH = $isDesktop ? 50 : 20}
	{@const content = value.length > MAX_LENGTH ? value.substring(0, MAX_LENGTH) + '...' : value}
	<PropertyResponsiveWrapper
		bind:open={wrapperState.isOpen}
		alignCenter={false}
		btnClass={buttonClass}
		mobileClass="p-2"
		desktopClass={cn('w-full max-w-lg', value && value?.length < MAX_LENGTH && 'max-w-xs')}
	>
		{#snippet header()}
			{@render miniWrapper(content)}
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
				onkeypress={handleEnterKeypress}
			></textarea>
		</form>
	</PropertyResponsiveWrapper>
{:else if property.type === 'NUMBER' && (value || isTableView)}
	<PropertyResponsiveWrapper
		bind:open={wrapperState.isOpen}
		alignCenter={false}
		btnClass={buttonClass}
		mobileClass="p-2"
	>
		{#snippet header()}
			{@render miniWrapper(value)}
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
				onkeypress={handleEnterKeypress}
			/>
		</form>
	</PropertyResponsiveWrapper>
{:else if value || isTableView}
	<PropertyResponsiveWrapper
		bind:open={wrapperState.isOpen}
		btnClass={buttonClass}
		alignCenter={false}
	>
		{#snippet header()}
			{@render miniWrapper(value)}
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

{#snippet miniWrapper(content: string, isWrappered: boolean = false)}
	{@const wrapperClass = cn(
		isWrappered && 'h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold',
		PROPERTY_COLORS[color]
	)}
	<span use:melt={$trigger} class={wrapperClass}>
		{content}
	</span>

	{@render tooltipContent()}
{/snippet}

{#snippet tooltipContent()}
	{#if $open && !isTableView}
		<div
			use:melt={$content}
			transition:fade={{ duration: 100 }}
			class="z-10 rounded-lg bg-secondary shadow"
		>
			<div use:melt={$arrow}></div>
			<div class="flex items-center p-1">
				<PropertyIcon key={property.type} class="icon-xs mr-1" />
				<span class="text-sm font-semibold">{property.name}</span>
			</div>
		</div>
	{/if}
{/snippet}

{#snippet clearBtn()}
	<Separator class="my-0.5" />
	<Button
		variant="ghost"
		class="h-7 w-full font-semibold"
		disabled={value === ''}
		on:click={() => {
			updPropertyRef('');
			wrapperState.close();
		}}
	>
		Clear
	</Button>
{/snippet}
