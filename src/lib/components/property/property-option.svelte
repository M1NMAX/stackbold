<script lang="ts">
	import { CheckCheck, Trash } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { PROPERTY_COLORS } from '$lib/constant';
	import type { Color, Option } from '@prisma/client';
	import { tick } from 'svelte';
	import { cn } from '$lib/utils';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { getOutsideClickState } from './context';

	export let propertyId: string;
	export let option: Option;

	let open = false;

	let value = option.color as string;
	$: selectedKey = (Object.keys(PROPERTY_COLORS).find((key) => key === value) as Color) ?? 'GRAY';

	const outsideClickState = getOutsideClickState();

	const dispatch = createEventDispatcher<{
		updOptColor: { propertyId: string; optionId: string; color: Color };
		updOptValue: { propertyId: string; optionId: string; value: string };
		deleteOpt: { propertyId: string; optionId: string };
	}>();

	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;
		dispatch('updOptValue', { propertyId, optionId: option.id, value: targetEl.value });
	}

	function handleSelectColor(selectedKey: string, triggerId: string) {
		value = selectedKey;
		dispatch('updOptColor', { propertyId, optionId: option.id, color: value as Color });

		// Refocus the trigger btn when user selects and item from the list,
		// so users can navigating using the keyboard
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
			$outsideClickState = true;
		});
	}

	function onOpenChange(open: boolean) {
		tick().then(() => {
			$outsideClickState = !open;
		});
	}
</script>

<div class="w-full flex justify-between items-center space-x-1.5">
	<Popover.Root bind:open let:ids {onOpenChange}>
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
		<Popover.Content class="w-[120px] p-1 space-y-2">
			<div class="grid grid-cols-4 gap-1">
				{#each Object.entries(PROPERTY_COLORS) as [colorName, colorClasses]}
					<Button
						aria-label={colorName.toLowerCase()}
						variant="outline"
						size="xs"
						class={cn(
							' relative h-6 w-6 rounded hover:-translate-y-0.5 transition-transform duration-300',
							colorClasses
						)}
						on:click={() => handleSelectColor(colorName, ids.trigger)}
					>
						<CheckCheck
							class={cn(
								'icon-xs absolute -top-0.5 -right-0.5  text-transparent',
								value === colorName && 'text-white'
							)}
						/>
					</Button>
				{/each}
			</div>
		</Popover.Content>
	</Popover.Root>

	<input
		name="option"
		value={option.value}
		on:input={handleOnInput}
		class="grow input input-xs text-sm font-semibold input-ghost"
	/>

	<Button
		variant="ghost"
		size="xs"
		on:click={() => dispatch('deleteOpt', { propertyId, optionId: option.id })}
		class="rounded-md hover:text-primary"
	>
		<Trash class="icon-xs" />
	</Button>
</div>
