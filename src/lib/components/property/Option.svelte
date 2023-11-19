<script lang="ts">
	import { Check, Trash } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { PROPERTY_COLORS } from '$lib/constant';
	import type { Color, Option } from '@prisma/client';
	import { tick } from 'svelte';
	import { capitalizeFirstLetter, cn } from '$lib/utils';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';

	export let propertyId: string;
	export let option: Option;

	const dispatch = createEventDispatcher<{
		updOptColor: { propertyId: string; optionId: string; color: Color };
		updOptValue: { propertyId: string; optionId: string; value: string };
		deleteOpt: { propertyId: string; optionId: string };
	}>();

	const handleOnInput = (e: Event) => {
		const targetEl = e.target as HTMLInputElement;
		dispatch('updOptValue', { propertyId, optionId: option.id, value: targetEl.value });
	};

	let open = false;

	let value = option.color as string;
	$: selectedKey = (Object.keys(PROPERTY_COLORS).find((key) => key === value) as Color) ?? 'GRAY';

	const handleSelectColor = (currValue: string, triggerId: string) => {
		value = currValue;
		dispatch('updOptColor', { propertyId, optionId: option.id, color: value as Color });

		// Refocus the trigger btn when user selects and item from the list,
		// so users can navigating using the keyboard
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	};
</script>

<div class="w-full flex justify-between items-center space-x-1.5">
	<Popover.Root bind:open let:ids>
		<Popover.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="outline"
				size="xs"
				role="combobox"
				aria-expanded={open}
				class={`${PROPERTY_COLORS[selectedKey]} h-6 w-6 rounded`}
			/>
		</Popover.Trigger>
		<Popover.Content class="w-[200px] p-0">
			<Command.Root>
				<Command.Input placeholder="Search colors..." />
				<Command.Empty>No color found.</Command.Empty>
				<Command.Group>
					{#each Object.entries(PROPERTY_COLORS) as [key, value]}
						<Command.Item
							value={key}
							onSelect={(currentValue) => handleSelectColor(currentValue, ids.trigger)}
							class="space-x-2"
						>
							<Check class={cn('mr-2 icon-xxs', key !== selectedKey && 'text-transparent')} />
							<span class={`${value} h-5 w-5`} />
							<span>
								{capitalizeFirstLetter(key)}
							</span>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>

	<input
		name="option"
		value={option.value}
		on:input={handleOnInput}
		class="grow input input-xs text-sm font-semibold input-ghost"
	/>

	<Button
		variant="destructive"
		size="xs"
		on:click={() => dispatch('deleteOpt', { propertyId, optionId: option.id })}
		class="rounded-md"
	>
		<Trash class="icon-xss" />
	</Button>
</div>
