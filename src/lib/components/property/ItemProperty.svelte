<script lang="ts">
	import { PROPERTY_COLORS } from '$lib/constant';
	import { createEventDispatcher } from 'svelte';
	import type { CollectionProperty, Color } from '@prisma/client';
	import { CalendarIcon, Check } from 'lucide-svelte';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Calendar } from '../ui/calendar';

	import {
		CalendarDate,
		type DateValue,
		DateFormatter,
		getLocalTimeZone
	} from '@internationalized/date';

	export let itemId: string;
	export let property: CollectionProperty;
	export let color: Color = 'GRAY';
	export let value: string | null;

	const dispatch = createEventDispatcher<{
		updPropertyValue: { itemId: string; property: { id: string; value: string } };
	}>();

	const handleOnInput = (e: Event) => {
		const input = e.target as HTMLInputElement;

		const currValue = input.type === 'checkbox' ? input.checked.toString() : input.value;

		dispatch('updPropertyValue', { itemId, property: { id: property.id, value: currValue } });
	};

	let open = false;

	$: selectedValue =
		property.options.find((opt) => opt.id === value)?.value ?? 'Select a option...';

	const df = new DateFormatter('en-US', { dateStyle: 'long' });

	let dateValue: DateValue | undefined = undefined;
</script>

{#if value}
	{#if property.type === 'CHECKBOX'}
		<label
			class={` ${PROPERTY_COLORS[color]} label rounded inline-flex items-center justify-center space-x-1 text-sm   font-semibold px-1 py-0.5  `}
		>
			<input type="checkbox" checked={value === 'true'} on:input={handleOnInput} class="checkbox" />

			<span class="label-text font-semibold">{property.name} </span>
		</label>
	{:else if property.type === 'SELECT'}
		<Popover.Root bind:open>
			<Popover.Trigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="outline"
					role="combobox"
					aria-expanded={open}
					class={`${PROPERTY_COLORS[color]} h-6 rounded outline-none border-0 py-1 px-1.5 font-semibold `}
				>
					{selectedValue}
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-[200px] p-0">
				<Command.Root>
					<Command.Input placeholder={`Search ${property.name} options...`} />
					<Command.Empty>No option found.</Command.Empty>
					<Command.Group>
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
								class="space-x-2"
							>
								<Check class={cn('icon-xs mr-2', value !== option.id && 'text-transparent')} />

								<span class={cn('icon-xs mr-2', PROPERTY_COLORS[option.color])} />
								<span>
									{option.value}
								</span>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	{:else if property.type === 'DATE'}
		{@const valueAsDate = new Date(value)}
		<Popover.Root bind:open>
			<Popover.Trigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="secondary"
					class={cn('h-6 py-1 px-1.5 rounded font-semibold', PROPERTY_COLORS[color])}
				>
					<CalendarIcon class="icon-xs mr-2" />
					{df.format(
						new CalendarDate(
							valueAsDate.getFullYear(),
							valueAsDate.getMonth(),
							valueAsDate.getDate()
						).toDate(getLocalTimeZone())
					)}
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-auto p-0" align="start">
				<Calendar
					value={new CalendarDate(
						valueAsDate.getFullYear(),
						valueAsDate.getMonth(),
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
	{:else}
		<Popover.Root bind:open>
			<Popover.Trigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="secondary"
					class={cn('h-6 py-1 px-1.5 rounded  font-semibold', PROPERTY_COLORS[color])}
				>
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
{/if}
