<script lang="ts">
	import { Check, ChevronRight, MoreHorizontal, Trash } from 'lucide-svelte';
	import { PROPERTY_COLORS } from '$lib/constant';
	import type { Color, Option } from '@prisma/client';
	import { tick } from 'svelte';
	import { capitalizeFirstLetter, cn } from '$lib/utils';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { getScreenSizeState } from '$lib/components/screen';
	import { getDeleteModalState } from '$lib/components/modal';
	import debounce from 'debounce';
	import { getPropertyState } from './propertyState.svelte';
	import type { UpdOption } from '$lib/types';

	type Props = {
		propertyId: string;
		option: Option;
	};

	let { propertyId, option }: Props = $props();

	let isSmallScreenDrawerOpen = $state(false);

	let value = $state(option.color as string);

	let selectedKey = $derived.by(() => {
		return (Object.keys(PROPERTY_COLORS).find((key) => key === value) as Color) ?? 'GRAY';
	});

	const propertyState = getPropertyState();
	const isLargeScreen = getScreenSizeState();
	const deleteModal = getDeleteModalState();

	const updOptionDebounded = debounce(updOption, 1000);

	async function updOption(pid: string, option: UpdOption) {
		await propertyState.updPropertyOption(pid, option);
	}

	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;
		updOptionDebounded(propertyId, { id: option.id, value: targetEl.value });
	}

	function handleSelectColor(selectedKey: string, triggerId?: string) {
		value = selectedKey;
		updOptionDebounded(propertyId, { id: option.id, color: value as Color });

		// Refocus the trigger btn when user selects and item from the list,
		// so users can navigating using the keyboard
		if (!isLargeScreen.current && isSmallScreenDrawerOpen) closeSmallScreenDrawer();
		//FIXME:
		if (!triggerId) return;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	function closeSmallScreenDrawer() {
		isSmallScreenDrawerOpen = false;
	}

	function deleteOption() {
		if (isSmallScreenDrawerOpen) isSmallScreenDrawerOpen = false;

		deleteModal.open({
			type: 'option',
			id: propertyId,
			option: option.id,
			name: option.value,
			fun: () => {
				propertyState.deletePropertyOption(propertyId, option.id);
			}
		});
	}
</script>

{#if isLargeScreen.current}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={buttonVariants({
				variant: 'ghost',
				size: 'sm',
				className: 'h-7 w-full justify-between px-0.5'
			})}
		>
			<span class="flex items-center gap-2">
				<span class={`size-3.5 rounded-sm ${PROPERTY_COLORS[selectedKey]}`}></span>
				<span>{option.value}</span>
			</span>
			<ChevronRight class="icon-xs" />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-56 p-1">
			<input
				name="option"
				value={option.value}
				oninput={handleOnInput}
				class="input input-bordered input-sm"
			/>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Label class="text-xs">Colors</DropdownMenu.Label>

				<DropdownMenu.RadioGroup
					{value}
					onValueChange={(value) => {
						if (!value) return;
						handleSelectColor(value, '');
					}}
				>
					{#each Object.entries(PROPERTY_COLORS) as [colorName, colorClasses]}
						<DropdownMenu.RadioItem value={colorName} class="py-1">
							<span class={`h-5 w-5 mr-2 rounded ${colorClasses}`}></span>

							{capitalizeFirstLetter(colorName)}
						</DropdownMenu.RadioItem>
					{/each}
				</DropdownMenu.RadioGroup>
			</DropdownMenu.Group>

			<DropdownMenu.Separator />
			<DropdownMenu.Item class="space-x-2 " onclick={() => deleteOption()}>
				<Trash class="icon-xs" />
				<span>Delete option </span>
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<div class="w-full flex justify-between items-center space-x-1">
		<div class="w-full relative">
			<div class="absolute inset-y-0 pl-1 flex items-center pointer-events-none">
				<span class={`size-3.5 rounded-sm ${PROPERTY_COLORS[selectedKey]}`}></span>
			</div>

			<input
				name="option"
				value={option.value}
				oninput={handleOnInput}
				class={`h-7 w-full pl-8 px-1.5 text-base font-semibold rounded-sm bg-secondary focus:outline-none `}
			/>
		</div>
		<Drawer.Root bind:open={isSmallScreenDrawerOpen}>
			<Drawer.Trigger class={buttonVariants({ variant: 'secondary', size: 'xs' })}>
				<MoreHorizontal class="icon-xs" />
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
									onclick={() => handleSelectColor(colorName)}
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

					<Button variant="destructive" onclick={() => deleteOption()}>
						<Trash class="icon-xs" />
						<span>Delete option </span>
					</Button>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	</div>
{/if}
