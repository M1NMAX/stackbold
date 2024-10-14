<script lang="ts">
	import { Check } from 'lucide-svelte';
	import type { Property } from '@prisma/client';
	import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import { Separator } from '$lib/components/ui/separator';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { DEBOUNCE_INTERVAL, PROPERTY_COLORS } from '$lib/constant';
	import { cn } from '$lib/utils';
	import { getItemState } from '$lib/components/items';
	import debounce from 'debounce';
	import { textareaAutoSize } from '$lib/actions';
	import { ModalState } from '$lib/components/modal';
	import { getOption, getPropertyColor, getPropertyRef, PropertyResponsiveWrapper } from '.';

	type Props = {
		property: Property;
		itemId: string;
	};

	let { property, itemId }: Props = $props();

	const itemState = getItemState();

	let value = $derived(getPropertyValue());
	let color = $derived(getPropertyColor(property, value));

	let wrapperState = new ModalState();

	const updPropertyRefDebounced = debounce(updPropertyRef, DEBOUNCE_INTERVAL);
	async function updPropertyRef(ref: { id: string; value: string }) {
		await itemState.updPropertyRef(itemId, ref);
	}

	// TODO: Input validation
	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;
		const currValue = targetEl.type === 'checkbox' ? targetEl.checked.toString() : targetEl.value;
		if (!targetEl.validity.badInput) {
			updPropertyRefDebounced({ id: property.id, value: currValue });
		}
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
</script>

{#if property.type === 'CHECKBOX'}
	<input
		id={property.id}
		type="checkbox"
		checked={value === 'true'}
		oninput={handleOnInput}
		class="checkbox"
	/>
{:else if property.type === 'SELECT'}
	{@const selected = getOption(property.options, value)?.value ?? ''}
	<PropertyResponsiveWrapper
		bind:open={wrapperState.isOpen}
		btnClass="w-full justify-start p-0.5 bg-secondary/40 hover:bg-secondary/80"
		mobileClass="p-2"
		desktopClass="p-1"
		sameWidth
		portal
	>
		{#snippet header()}
			{#if selected}
				{@render miniWrapper(selected)}
			{/if}
		{/snippet}

		<div>
			<p class="font-semibold text-sm px-0 pb-0.5">{property.name}</p>
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
							on:click={() => {
								updPropertyRef({ id: property.id, value: option.id });
								wrapperState.close();
							}}
						/>
					</Label>
				{/each}
			</RadioGroup.Root>
		</div>

		{@render clearBtn()}
	</PropertyResponsiveWrapper>
{:else if property.type === 'DATE'}
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
		btnClass="w-full justify-start p-0.5 bg-secondary/40 hover:bg-secondary/80"
		desktopClass="w-auto p-0"
	>
		{#snippet header()}
			{#if value}
				{@render miniWrapper(content)}
			{/if}
		{/snippet}

		<p class="font-semibold text-sm px-0 py-1 text-center">
			{property.name}
		</p>
		<div class="w-full max-w-xs mx-auto px-6 md:px-4 pb-2">
			<Calendar
				value={new CalendarDate(
					valueAsDate.getFullYear(),
					valueAsDate.getMonth() + plus,
					valueAsDate.getDate()
				)}
				onValueChange={(dt) => {
					if (!dt) return;

					updPropertyRef({ id: property.id, value: dt.toString() });
					wrapperState.close();
				}}
				class="p-0"
			/>
		</div>
		{@render clearBtn()}
	</PropertyResponsiveWrapper>
{:else if property.type === 'TEXT'}
	<textarea
		use:textareaAutoSize
		id={property.id}
		name={property.name}
		{value}
		oninput={handleOnInput}
		placeholder="Empty"
		class="textarea textarea-ghost"
	></textarea>
{:else if property.type === 'NUMBER'}
	<input
		id={property.id}
		type="number"
		{value}
		step="any"
		oninput={handleOnInput}
		class="input input-ghost"
	/>
{:else}
	<input
		id={property.id}
		type={property.type.toLowerCase()}
		{value}
		oninput={handleOnInput}
		class="input input-ghost"
	/>
{/if}

{#snippet miniWrapper(content: string)}
	{@const wrapperClass = cn(
		'h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold',
		PROPERTY_COLORS[color]
	)}

	<span class={wrapperClass}>
		{content}
	</span>
{/snippet}

{#snippet clearBtn()}
	<Separator class="my-0.5" />
	<Button
		variant="ghost"
		disabled={value === ''}
		on:click={onClickClear}
		class="h-7 w-full font-semibold">Clear</Button
	>
{/snippet}
