<script lang="ts">
	import { Check, ChevronRight, MoreHorizontal, Trash } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { PROPERTY_COLORS } from '$lib/constant';
	import type { Color, Option } from '@prisma/client';
	import { tick } from 'svelte';
	import { capitalizeFirstLetter, cn } from '$lib/utils';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	import { Button } from '$lib/components/ui/button';
	import { getScreenState } from '$lib/components/view';

	export let propertyId: string;
	export let option: Option;
	let isSmallScreenDrawerOpen = false;

	let value = option.color as string;
	$: selectedKey = (Object.keys(PROPERTY_COLORS).find((key) => key === value) as Color) ?? 'GRAY';

	const isDesktop = getScreenState();

	const dispatch = createEventDispatcher<{
		updOptColor: { propertyId: string; optionId: string; color: Color };
		updOptValue: { propertyId: string; optionId: string; value: string };
		deleteOpt: { propertyId: string; optionId: string };
	}>();

	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;
		dispatch('updOptValue', { propertyId, optionId: option.id, value: targetEl.value });
	}

	function handleSelectColor(selectedKey: string, triggerId?: string) {
		value = selectedKey;
		dispatch('updOptColor', { propertyId, optionId: option.id, color: value as Color });

		// Refocus the trigger btn when user selects and item from the list,
		// so users can navigating using the keyboard

		if (!$isDesktop && isSmallScreenDrawerOpen) closeSmallScreenDrawer();
		if (!triggerId) return;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	function closeSmallScreenDrawer() {
		isSmallScreenDrawerOpen = false;
	}
</script>

{#if $isDesktop}
	<DropdownMenu.Root let:ids>
		<DropdownMenu.Trigger asChild let:builder>
			<Button builders={[builder]} variant="ghost" size="sm" class="w-full justify-between px-0.5">
				<span class="flex gap-2">
					<span class={`h-5 w-5 rounded ${PROPERTY_COLORS[selectedKey]}`} />
					<span>{option.value}</span>
				</span>
				<ChevronRight class="icon-xs" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-56 p-1">
			<input
				name="option"
				value={option.value}
				on:input={handleOnInput}
				class="input input-bordered input-sm"
			/>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Label class="text-xs">Colors</DropdownMenu.Label>

				<DropdownMenu.RadioGroup
					{value}
					onValueChange={(value) => {
						if (!value) return;
						handleSelectColor(value, ids.trigger);
					}}
				>
					{#each Object.entries(PROPERTY_COLORS) as [colorName, colorClasses]}
						<DropdownMenu.RadioItem value={colorName}>
							<span class={`h-6 w-6 mr-2 rounded ${colorClasses}`} />

							{capitalizeFirstLetter(colorName)}
						</DropdownMenu.RadioItem>
					{/each}
				</DropdownMenu.RadioGroup>
			</DropdownMenu.Group>

			<DropdownMenu.Separator />
			<DropdownMenu.Item
				class="space-x-2 "
				on:click={() => dispatch('deleteOpt', { propertyId, optionId: option.id })}
			>
				<Trash class="icon-xs" />
				<span>Delete option </span>
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<div class="w-full flex justify-between items-center space-x-1">
		<div class="w-full relative">
			<div class="absolute inset-y-0 pl-1 flex items-center pointer-events-none">
				<span class={`h-6 w-6 rounded ${PROPERTY_COLORS[selectedKey]}`} />
			</div>

			<input
				name="option"
				value={option.value}
				on:input={handleOnInput}
				class={`h-7 w-full pl-8 px-1.5 text-base font-semibold rounded bg-secondary focus:outline-none `}
			/>
		</div>
		<Drawer.Root bind:open={isSmallScreenDrawerOpen}>
			<Drawer.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" size="xs">
					<MoreHorizontal class="icon-xs" />
				</Button>
			</Drawer.Trigger>
			<Drawer.Content>
				<Drawer.Header class="py-2">
					<Drawer.Title>{option.value}</Drawer.Title>
					<Drawer.Description>Option</Drawer.Description>
				</Drawer.Header>

				<Drawer.Footer class="pt-2">
					<hr />
					<div class="mx-auto">
						<div class="px-2 py-1.5 text-center text-base font-semibold">Colors</div>
						<div class="mx-auto flex space-x-2">
							{#each Object.entries(PROPERTY_COLORS) as [colorName, colorClasses]}
								<Button
									aria-label={colorName.toLowerCase()}
									variant="outline"
									size="xs"
									class={`relative h-8 w-8 rounded ${colorClasses} `}
									on:click={() => {
										handleSelectColor(colorName);
									}}
								>
									<Check
										class={cn(
											'icon-xs absolute top[50%] left[50%]   text-transparent',
											value === colorName && 'text-white'
										)}
									/>
									<span class="sr-only"> {colorName}</span>
								</Button>
							{/each}
						</div>
					</div>
					<hr />

					<Button
						variant="destructive"
						on:click={() => {
							closeSmallScreenDrawer();
							dispatch('deleteOpt', { propertyId, optionId: option.id });
						}}
					>
						<Trash class="icon-xs" />
						<span>Delete option </span>
					</Button>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	</div>
{/if}
