<script lang="ts">
	import { createTooltip, melt } from '@melt-ui/svelte';
	import {
		DEBOUNCE_INTERVAL,
		MAX_PROPERTY_NUMERIC_LENGTH,
		MAX_PROPERTY_TEXT_LENGTH,
		PROPERTY_COLORS
	} from '$lib/constant';
	import { type Property, View } from '@prisma/client';
	import { Check, Eraser } from 'lucide-svelte';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { cn, sanitizeNumberInput } from '$lib/utils';
	import { Calendar } from '$lib/components/ui/calendar';
	import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import {
		getOption,
		getPropertyColor,
		getPropertyRef,
		PropertyIcon,
		PropertyResponsiveWrapper
	} from '.';
	import { getScreenSizeState } from '$lib/components/screen';
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
		view?: View;
	};

	let { itemId, property, view = View.LIST }: Props = $props();

	const itemState = getItemState();
	const isLargeScreen = getScreenSizeState();

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
		if (property.type === 'NUMBER') {
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
		const value = property.type !== 'NUMBER' ? targetEl.value : sanitizeNumberInput(targetEl.value);

		wrapperState.close();
		await updPropertyRef(value);
	}

	const buttonClass = $derived(
		cn(
			isTableView()
				? 'w-full justify-start py-2 px-1 rounded-none border-0 bg-inherit'
				: `w-fit h-6 py-1 px-1.5 rounded-sm font-semibold ${PROPERTY_COLORS[color]} hover:bg-current/90 hover:text-white`,
			property.type === 'NUMBER' && 'justify-end'
		)
	);

	const labelClass = cn(
		'font-semibold text-sm text-center px-0 pb-0.5 pt-1',
		isLargeScreen.current && 'sr-only'
	);

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

	function isTableView() {
		return view === View.TABLE;
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
			!isTableView() &&
				'inline-flex items-center justify-center space-x-1 py-0.5 px-1 rounded-sm text-sm font-semibold',
			!isTableView() && PROPERTY_COLORS[color]
		)}
	>
		<input type="checkbox" checked={value === 'true'} oninput={handleOnInput} class="checkbox" />

		<span class={cn('font-semibold', isTableView() && 'sr-only')}>{property.name} </span>
	</label>
{:else if property.type === 'SELECT' && (value || isTableView())}
	{@const selectedOption = getOption(property.options, value)?.value ?? ''}
	<PropertyResponsiveWrapper
		bind:open={wrapperState.isOpen}
		alignCenter={false}
		btnClass={buttonClass}
		mobileClass="p-2"
		desktopClass="w-full p-1"
	>
		{#snippet header()}
			{@render tooltipWrapper(selectedOption, !!value && isTableView())}
		{/snippet}

		<div>
			<p class={labelClass}>{property.name}</p>
			<RadioGroup.Root value={value || undefined} class="gap-y-0">
				{#each property.options as option}
					<Label
						for={option.id}
						class="w-full flex items-center space-x-1.5 py-1.5 px-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
					>
						<span class={cn('size-3.5 rounded-sm', PROPERTY_COLORS[option.color])}></span>
						<span class="grow text-sm font-semibold pr-10">
							{option.value}
						</span>

						<Check class={cn('icon-xs', value !== option.id && 'text-transparent')} />
						<RadioGroup.Item
							value={option.id}
							id={option.id}
							class="sr-only"
							onclick={() => updPropertyRef(option.id)}
						/>
					</Label>
				{/each}
			</RadioGroup.Root>
		</div>

		{@render clearBtn()}
	</PropertyResponsiveWrapper>
{:else if property.type === 'DATE' && (value || isTableView())}
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
		desktopClass="w-auto p-1"
		mobileClass="p-2"
	>
		{#snippet header()}
			{#if value}
				{@render tooltipWrapper(content, !!value && isTableView())}
			{/if}
		{/snippet}

		<p class={cn(labelClass, 'text-center py-1')}>{property.name}</p>
		<div class="w-full p-0.5">
			<Calendar
				type="single"
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
{:else if property.type === 'TEXT' && (value || isTableView())}
	{@const MAX_LENGTH = isLargeScreen.current ? 50 : 20}
	{@const content = value.length > MAX_LENGTH ? value.substring(0, MAX_LENGTH) + '...' : value}
	<PropertyResponsiveWrapper
		bind:open={wrapperState.isOpen}
		alignCenter={false}
		btnClass={buttonClass}
		mobileClass="p-2"
		desktopClass={cn('w-full max-w-xl p-1', value && value?.length < MAX_LENGTH && 'max-w-xs')}
	>
		{#snippet header()}
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
	</PropertyResponsiveWrapper>
{:else if property.type === 'NUMBER' && (value || isTableView())}
	<PropertyResponsiveWrapper
		bind:open={wrapperState.isOpen}
		alignCenter={false}
		btnClass={buttonClass}
		mobileClass="p-2"
		desktopClass="p-1"
	>
		{#snippet header()}
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
	</PropertyResponsiveWrapper>
{:else if value || isTableView()}
	<PropertyResponsiveWrapper
		bind:open={wrapperState.isOpen}
		btnClass={buttonClass}
		alignCenter={false}
		desktopClass="p-1"
	>
		{#snippet header()}
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
	</PropertyResponsiveWrapper>
{/if}

{#snippet tooltipWrapper(content: string, isWrappered: boolean = false)}
	{@const wrapperClass = cn(
		isWrappered && 'h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold',
		isWrappered && PROPERTY_COLORS[color]
	)}
	<span use:melt={$trigger} class={wrapperClass}>
		{content}
	</span>

	{@render tooltipContent()}
{/snippet}

{#snippet tooltipContent()}
	{#if $open && !isTableView()}
		<div
			use:melt={$content}
			transition:fade={{ duration: 100 }}
			class="z-10 rounded-sm bg-white dark:bg-gray-900 shadow-xl"
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
