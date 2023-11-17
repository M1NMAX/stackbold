<script lang="ts">
	import { PROPERTY_COLORS } from '$lib/constant';
	import { createEventDispatcher } from 'svelte';
	import type { CollectionProperty, Color } from '@prisma/client';

	import { Check } from 'lucide-svelte';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { tick } from 'svelte';

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

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
</script>

{#if value}
	{#if property.type === 'CHECKBOX'}
		<label
			class={` ${PROPERTY_COLORS[color]} label rounded inline-flex items-center justify-center space-x-1 text-sm   font-semibold px-1 py-0.5  `}
		>
			<input
				type="checkbox"
				checked={value === 'true'}
				on:input={handleOnInput}
				class="checkbox checkbox-xs checkbox-primary"
			/>
			<span class="label-text font-semibold">{property.name} </span>
		</label>
	{:else if property.type === 'SELECT'}
		<Popover.Root bind:open let:ids>
			<Popover.Trigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="outline"
					role="combobox"
					aria-expanded={open}
					class={`${PROPERTY_COLORS[color]} h-6`}
				>
					{selectedValue}
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-[200px] p-0">
				<Command.Root>
					<Command.Input placeholder="Search options..." />
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
									closeAndFocusTrigger(ids.trigger);
								}}
								class="space-x-2"
							>
								<Check class={cn('mr-2 h-4 w-4', value !== option.id && 'text-transparent')} />

								<span class={` ${PROPERTY_COLORS[option.color]} w-4 h-4 mr-2 `} />
								<span>
									{option.value}
								</span>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	{:else}
		<div
			class={` ${PROPERTY_COLORS[color]} rounded inline-flex items-center justify-center space-x-1 text-sm font-semibold px-1 py-0.5 `}
		>
			{value}
		</div>
	{/if}
{/if}
