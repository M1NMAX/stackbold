<script lang="ts">
	import { Check } from 'lucide-svelte';
	import type { Property } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';
	import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import { Separator } from '$lib/components/ui/separator';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { PROPERTY_COLORS } from '$lib/constant';
	import { cn } from '$lib/utils';
	import { getScreenState } from '$lib/components/view';

	export let property: Property;
	export let value: string;

	let open = false;

	const isDesktop = getScreenState();
	const dispatch = createEventDispatcher<{
		updPropertyValue: { pid: string; value: string };
	}>();

	// TODO: Input validation
	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;
		const currValue = targetEl.type === 'checkbox' ? targetEl.checked.toString() : targetEl.value;
		if (!targetEl.validity.badInput)
			dispatch('updPropertyValue', { pid: property.id, value: currValue });
	}

	function handleClickClear() {
		dispatch('updPropertyValue', { pid: property.id, value: '' });
		open = false;
	}

	$: selectedValue = property.options.find((opt) => opt.id === value) ?? 'Empty';
</script>

{#if property.type === 'CHECKBOX'}
	<input
		id={property.id}
		type="checkbox"
		checked={value === 'true'}
		on:input={handleOnInput}
		class="checkbox"
	/>
{:else if property.type === 'SELECT'}
	{#if $isDesktop}
		<Popover.Root bind:open portal="HTMLElement">
			<Popover.Trigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="ghost"
					role="combobox"
					aria-expanded={open}
					class="w-full justify-start p-0.5"
				>
					{#if typeof selectedValue === 'string'}
						<span class="px-1 text-base text-slate-500">
							{selectedValue}
						</span>
					{:else}
						<span
							class={cn(
								'h-6 flex items-center py-1 px-1.5  rounded font-semibold',
								PROPERTY_COLORS[selectedValue.color]
							)}
						>
							{selectedValue.value}
						</span>
					{/if}
				</Button>
			</Popover.Trigger>
			<Popover.Content sameWidth={true}>
				<Command.Root>
					<Command.Input placeholder="Search for an options..." />

					<Command.Group heading={property.options.length > 0 ? 'Select an option' : undefined}>
						{#each property.options as option}
							<Command.Item
								value={option.value}
								onSelect={() => {
									value = option.id;
									dispatch('updPropertyValue', {
										pid: property.id,
										value
									});
									open = false;
								}}
								class="justify-between space-x-2 p-1 rounded"
							>
								<span
									class={cn(
										'h-6 flex items-center py-1 px-1.5 rounded',
										PROPERTY_COLORS[option.color]
									)}
								>
									{option.value}
								</span>
								<Check
									class={cn('icon-sm text-primary', value !== option.id && 'text-transparent')}
								/>
							</Command.Item>
						{/each}
					</Command.Group>
					<Command.Empty>No option found.</Command.Empty>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	{:else}
		<Dialog.Root bind:open>
			<Dialog.Trigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="ghost"
					role="combobox"
					aria-expanded={open}
					class="w-full justify-start p-0.5"
				>
					{#if typeof selectedValue === 'string'}
						<span class="px-1 text-base text-slate-500">
							{selectedValue}
						</span>
					{:else}
						<span
							class={cn(
								'h-6 flex items-center py-1 px-1.5  rounded font-semibold',
								PROPERTY_COLORS[selectedValue.color]
							)}
						>
							{selectedValue.value}
						</span>
					{/if}
				</Button>
			</Dialog.Trigger>
			<Dialog.Content class="p-0 pt-2">
				<Dialog.Header class="pb-0">
					<Dialog.Title class="text-center">{property.name}</Dialog.Title>
				</Dialog.Header>

				<Command.Root class="bg-inherit">
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
										pid: property.id,
										value
									});
									open = false;
								}}
								class="justify-between space-x-2 p-1 rounded"
							>
								<span
									class={cn(
										'h-6 flex items-center py-1 px-1.5 rounded',
										PROPERTY_COLORS[option.color]
									)}
								>
									{option.value}
								</span>
								<Check
									class={cn('icon-sm text-primary', value !== option.id && 'text-transparent')}
								/>
							</Command.Item>
						{/each}
					</Command.Group>
					<Command.Empty>No option found.</Command.Empty>
				</Command.Root>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
{:else if property.type === 'DATE'}
	<!--js current date need some adjustiments based on  https://stackoverflow.com/a/10211214 -->
	{@const plus = value ? 0 : 1}
	{@const valueAsDate = value ? new Date(value) : new Date()}
	{@const df = new DateFormatter('en-US', { dateStyle: 'long' })}

	{#if $isDesktop}
		<Popover.Root bind:open>
			<Popover.Trigger asChild let:builder>
				<Button builders={[builder]} variant="ghost" class="w-full justify-start p-0.5">
					{#if !value}
						<span class="px-1 text-base text-slate-500">Empty</span>
					{:else}
						<span class={cn('h-6 flex items-center py-1 px-1.5 rounded', PROPERTY_COLORS['GRAY'])}>
							{df.format(
								new CalendarDate(
									valueAsDate.getFullYear(),
									valueAsDate.getMonth(),
									valueAsDate.getDate()
								).toDate(getLocalTimeZone())
							)}
						</span>
					{/if}
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-auto space-y-1" align="start">
				<Calendar
					value={new CalendarDate(
						valueAsDate.getFullYear(),
						valueAsDate.getMonth() + plus,
						valueAsDate.getDate()
					)}
					onValueChange={(dt) => {
						if (!dt) return;
						value = dt.toString();

						dispatch('updPropertyValue', { pid: property.id, value });
						open = false;
					}}
				/>

				<Separator />
				<Button variant="ghost" on:click={handleClickClear} class="h-7 w-full font-semibold">
					Clear
				</Button>
			</Popover.Content>
		</Popover.Root>
	{:else}
		<Drawer.Root>
			<Drawer.Trigger asChild let:builder>
				<Button builders={[builder]} variant="ghost" class="w-full justify-start p-0.5">
					{#if !value}
						<span class="px-1 text-base text-slate-500">Empty</span>
					{:else}
						<span class={cn('h-6 flex items-center py-1 px-1.5 rounded', PROPERTY_COLORS['GRAY'])}>
							{df.format(
								new CalendarDate(
									valueAsDate.getFullYear(),
									valueAsDate.getMonth(),
									valueAsDate.getDate()
								).toDate(getLocalTimeZone())
							)}
						</span>
					{/if}
				</Button>
			</Drawer.Trigger>
			<Drawer.Content>
				<div class="mx-auto w-full max-w-xs">
					<Drawer.Header>
						<Drawer.Description>{property.name}</Drawer.Description>
					</Drawer.Header>
					<div class="px-4 pb-0">
						<Calendar
							value={new CalendarDate(
								valueAsDate.getFullYear(),
								valueAsDate.getMonth() + plus,
								valueAsDate.getDate()
							)}
							onValueChange={(dt) => {
								if (!dt) return;
								value = dt.toString();

								dispatch('updPropertyValue', { pid: property.id, value });
								open = false;
							}}
						/>
					</div>
				</div>
				<Separator />
				<Drawer.Footer>
					<Button variant="secondary" on:click={handleClickClear} class="h-7 w-full font-semibold">
						Clear
					</Button>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	{/if}
{:else if property.type === 'TEXT'}
	<!-- TODO: CHANGE URG -->
	<textarea
		id={property.id}
		name={property.name}
		{value}
		on:input={handleOnInput}
		placeholder="Empty"
		class="textarea textarea-ghost"
	/>
{:else if property.type === 'NUMBER'}
	<input
		id={property.id}
		type="number"
		{value}
		step="any"
		on:input={handleOnInput}
		class="input input-ghost"
	/>
{:else}
	<input
		id={property.id}
		type={property.type.toLowerCase()}
		{value}
		on:input={handleOnInput}
		class="input input-ghost"
	/>
{/if}
