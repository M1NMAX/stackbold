<script lang="ts">
	import { DEBOUNCE_INTERVAL, PROPERTY_COLORS } from '$lib/constant';
	import type { Property, Color } from '@prisma/client';
	import { CalendarIcon, CheckCheck } from 'lucide-svelte';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Calendar } from '$lib/components/ui/calendar';
	import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import { PropertyValueWrapper } from '.';
	import { getScreenState } from '$lib/components/view';
	import { getItemState } from '$lib/components/items';
	import debounce from 'debounce';

	type Props = {
		itemId: string;
		property: Property;
		color: Color;
		value: string | null;
		isTableView?: boolean;
	};

	let { itemId, property, color = 'GRAY', value, isTableView = false }: Props = $props();

	let open = $state(false);
	let selectedValue = $derived.by(() => {
		return property.options.find((opt) => opt.id === value)?.value ?? '';
	});

	const isDesktop = getScreenState();
	const itemState = getItemState();

	const updPropertyRefDebounced = debounce(updPropertyRef, DEBOUNCE_INTERVAL);
	async function updPropertyRef(value: string) {
		if (open) open = false;
		await itemState.updPropertyRef(itemId, { id: property.id, value });
	}

	function handleOnInput(e: Event) {
		// TODO: add validation
		const input = e.target as HTMLInputElement;
		const currValue = input.type === 'checkbox' ? input.checked.toString() : input.value;
		updPropertyRefDebounced(currValue);
	}

	const buttonClass = cn(
		'w-full justify-start py-2 px-1 rounded-none border-0 bg-inherit hover:bg-inherit',
		property.type === 'NUMBER' && 'justify-end',
		!isTableView && 'h-6 w-fit rounded outline-none  py-1 px-1.5 font-semibold',
		!isTableView && PROPERTY_COLORS[color]
	);

	// TODO: ref: most of property types are inside same components consider create a wrapper
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
		<input type="checkbox" checked={value === 'true'} oninput={handleOnInput} class="checkbox" />

		<span class={cn('font-semibold', isTableView && 'sr-only')}>{property.name} </span>
	</label>
{:else if property.type === 'SELECT' && (value || isTableView)}
	{#if $isDesktop}
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
			<Popover.Content align="start" class="w-[200px] p-0">
				<Command.Root>
					<Command.Input
						placeholder={property.options.length > 0 ? 'Search for an options...' : undefined}
					/>

					<Command.Group heading="Select an option">
						{#each property.options as option}
							<Command.Item
								value={option.value}
								onSelect={() => updPropertyRef(option.id)}
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
	{:else}
		<Dialog.Root bind:open>
			<Dialog.Trigger asChild let:builder>
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
								onSelect={() => updPropertyRef(option.id)}
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
			</Dialog.Content>
		</Dialog.Root>
	{/if}
{:else if property.type === 'DATE' && (value || isTableView)}
	<!--js current date need some adjustiments based on  https://stackoverflow.com/a/10211214 -->
	{@const plus = value ? 0 : 1}
	{@const valueAsDate = value ? new Date(value) : new Date()}
	{@const df = new DateFormatter('en-US', { dateStyle: 'long' })}

	{#if $isDesktop}
		<Popover.Root bind:open>
			<Popover.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" class={buttonClass}>
					{#if value}
						<PropertyValueWrapper
							isWrappered={!!value && isTableView}
							class={PROPERTY_COLORS[color]}
						>
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
						updPropertyRef(dt.toString());
					}}
				/>
			</Popover.Content>
		</Popover.Root>
	{:else}
		<Drawer.Root>
			<Drawer.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" class={buttonClass}>
					{#if value}
						<PropertyValueWrapper
							isWrappered={!!value && isTableView}
							class={PROPERTY_COLORS[color]}
						>
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
			</Drawer.Trigger>
			<Drawer.Content>
				<div class="mx-auto w-full max-w-xs">
					<Drawer.Header>
						<Drawer.Description>{property.name}</Drawer.Description>
					</Drawer.Header>
					<div class="p-4 pb-0">
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
						/>
					</div>
				</div>
			</Drawer.Content>
		</Drawer.Root>
	{/if}
{:else if property.type === 'TEXT' && (value || isTableView)}
	{@const MAX_STR_LENGTH = 50}
	{#if $isDesktop}
		<Popover.Root bind:open>
			<Popover.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" class={buttonClass}>
					{value?.substring(0, MAX_STR_LENGTH)}
					{value && value.length > MAX_STR_LENGTH ? '...' : ''}
				</Button>
			</Popover.Trigger>
			<Popover.Content
				class={cn('w-full max-w-lg', value && value?.length < MAX_STR_LENGTH && 'max-w-xs')}
			>
				<form>
					<label for={property.id} class="sr-only"> {property.name} </label>
					<!-- TODO : CHANGE URG -->

					<textarea
						id={property.id}
						name={property.name}
						placeholder="Empty"
						class="textarea textarea-ghost"
						{value}
						oninput={handleOnInput}
					></textarea>
				</form>
			</Popover.Content>
		</Popover.Root>
	{:else}
		<Dialog.Root bind:open>
			<Dialog.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" class={buttonClass}>
					{value?.substring(0, MAX_STR_LENGTH)}
					{value && value.length > MAX_STR_LENGTH ? '...' : ''}
				</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Description>
						{property.name}
					</Dialog.Description>
				</Dialog.Header>

				<form>
					<label for={property.id} class="sr-only"> {property.name} </label>

					<!-- TODO : GHANGE URG -->
					<textarea
						id={property.id}
						name={property.name}
						placeholder="Empty"
						class="textarea textarea-ghost"
						{value}
						oninput={handleOnInput}
					></textarea>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
{:else if property.type === 'NUMBER' && (value || isTableView)}
	{#if $isDesktop}
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
						type="number"
						step="any"
						{value}
						oninput={handleOnInput}
					/>
				</form>
			</Popover.Content>
		</Popover.Root>
	{:else}
		<Dialog.Root bind:open>
			<Dialog.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" class={buttonClass}>
					{value}
				</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Description>
						{property.name}
					</Dialog.Description>
				</Dialog.Header>

				<form>
					<label for={property.id} class="sr-only"> {property.name} </label>

					<input
						id={property.id}
						name={property.name}
						placeholder="Empty"
						class="w-full input input-ghost px-1 font-semibold text-sm"
						type="number"
						step="any"
						{value}
						oninput={handleOnInput}
					/>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
{:else if value || isTableView}
	{#if $isDesktop}
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
						oninput={handleOnInput}
					/>
				</form>
			</Popover.Content>
		</Popover.Root>
	{:else}
		<Dialog.Root bind:open>
			<Dialog.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" class={buttonClass}>
					{value}
				</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Description>
						{property.name}
					</Dialog.Description>
				</Dialog.Header>

				<form>
					<label for={property.id} class="sr-only"> {property.name} </label>

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
			</Dialog.Content>
		</Dialog.Root>
	{/if}
{/if}
