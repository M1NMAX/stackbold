<script lang="ts">
	import { PROPERTY_COLORS } from '$lib/constant';
	import { createEventDispatcher } from 'svelte';
	import type { CollectionProperty, Color } from '@prisma/client';
	import { CalendarIcon, CheckCheck } from 'lucide-svelte';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Calendar } from '../ui/calendar';
	import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import PropertyValueWrapper from './property-value-wrapper.svelte';

	export let itemId: string;
	export let property: CollectionProperty;
	export let color: Color = 'GRAY';
	export let value: string | null;
	export let isTableView: boolean = false;
	let open = false;

	const dispatch = createEventDispatcher<{
		updPropertyValue: { itemId: string; property: { id: string; value: string } };
	}>();

	const handleOnInput = (e: Event) => {
		const input = e.target as HTMLInputElement;

		const currValue = input.type === 'checkbox' ? input.checked.toString() : input.value;

		dispatch('updPropertyValue', { itemId, property: { id: property.id, value: currValue } });
	};

	const buttonClass = cn(
		'w-full justify-start py-2 px-1 rounded-none border-0 bg-inherit hover:bg-inherit',
		!isTableView && 'h-6 w-fit rounded outline-none  py-1 px-1.5 font-semibold',
		!isTableView && PROPERTY_COLORS[color]
	);

	$: selectedValue = property.options.find((opt) => opt.id === value)?.value ?? '';
</script>

{#if property.type === 'CHECKBOX'}
	<label
		class={cn(
			'flex justify-center',
			!isTableView &&
				'inline-flex items-center justify-center space-x-1 py-0.5 px-1 rounded text-sm font-semibold ',
			!isTableView && PROPERTY_COLORS[color]
		)}
	>
		<input type="checkbox" checked={value === 'true'} on:input={handleOnInput} class="checkbox" />

		<span class={cn('font-semibold', isTableView && 'sr-only')}>{property.name} </span>
	</label>
{:else if property.type === 'SELECT' && (value || isTableView)}
	<Popover.Root bind:open>
		<Popover.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="outline"
				role="combobox"
				aria-expanded={open}
				class={cn(buttonClass, !isTableView && PROPERTY_COLORS[color])}
			>
				<PropertyValueWrapper isWrappered={!!value && isTableView} class={PROPERTY_COLORS[color]}>
					{selectedValue}
				</PropertyValueWrapper>
			</Button>
		</Popover.Trigger>
		<Popover.Content class="w-[200px] p-0">
			<Command.Root>
				<Command.Input
					placeholder={property.options.length > 0 ? 'Search for an options...' : undefined}
				/>

				<Command.Group heading="Select an option">
					{#each property.options as option}
						<Command.Item
							value={option.value}
							onSelect={() => {
								value = option.id;
								dispatch('updPropertyValue', {
									itemId,
									property: { id: property.id, value }
								});
								open = false;
							}}
							class="justify-between"
						>
							<span
								class={cn(
									'h-6 flex items-center py-1 px-1.5 rounded',
									PROPERTY_COLORS[option.color]
								)}
							>
								{option.value}
							</span>
							<CheckCheck
								class={cn('icon-xs text-primary', value !== option.id && 'text-transparent')}
							/>
						</Command.Item>
					{/each}
				</Command.Group>
				<Command.Empty>No option found.</Command.Empty>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
{:else if property.type === 'DATE' && (value || isTableView)}
	<!--js current date need some adjustiments based on  https://stackoverflow.com/a/10211214 -->
	{@const plus = value ? 0 : 1}
	{@const valueAsDate = value ? new Date(value) : new Date()}
	{@const df = new DateFormatter('en-US', { dateStyle: 'long' })}

	<Popover.Root bind:open>
		<Popover.Trigger asChild let:builder>
			<Button builders={[builder]} variant="secondary" class={buttonClass}>
				{#if value}
					<PropertyValueWrapper isWrappered={!!value && isTableView} class={PROPERTY_COLORS[color]}>
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
			</Button>
		</Popover.Trigger>
		<Popover.Content class="w-auto p-0" align="start">
			<Calendar
				value={new CalendarDate(
					valueAsDate.getFullYear(),
					valueAsDate.getMonth() + plus,
					valueAsDate.getDate()
				)}
				onValueChange={(dt) => {
					if (!dt) return;
					value = dt.toString();

					dispatch('updPropertyValue', {
						itemId,
						property: { id: property.id, value }
					});
					open = false;
				}}
			/>
		</Popover.Content>
	</Popover.Root>
{:else if value || isTableView}
	<Popover.Root bind:open>
		<Popover.Trigger asChild let:builder>
			<Button builders={[builder]} variant="secondary" class={buttonClass}>
				{value}
			</Button>
		</Popover.Trigger>
		<Popover.Content>
			<form>
				<label for={property.id} class="sr-only"> {property.name} </label>

				<input
					id={property.id}
					name={property.name}
					placeholder="Empty"
					class="w-full input input-ghost px-1 font-semibold text-sm"
					type={property.type.toLowerCase()}
					{value}
					on:input={handleOnInput}
				/>
			</form>
		</Popover.Content>
	</Popover.Root>
{/if}
