<script module>
	import {
		ArrowDownAZ,
		ArrowDownZA,
		ArrowUpDown,
		CalendarArrowDown,
		CalendarArrowUp,
		Check,
		ClockArrowDown,
		ClockArrowUp,
		type Icon as IconType
	} from 'lucide-svelte';

	const icons: { [idx: string]: typeof IconType } = {
		'name-asc': ArrowDownAZ,
		'name-desc': ArrowDownZA,
		'updatedAt-asc': ClockArrowDown,
		'updatedAt-desc': ClockArrowUp,
		'createdAt-asc': CalendarArrowDown,
		'createdAt-desc': CalendarArrowUp
	};
</script>

<script lang="ts" generics="T">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Label } from '$lib/components/ui/label';
	import type { SortOption } from '$lib/utils/sort';
	import { ModalState } from '$lib/components/modal';
	import { cn } from '$lib/utils';

	type Props = {
		options: SortOption<T>[];
		value: SortOption<T>;
	};

	let { value = $bindable(), options }: Props = $props();

	const CurrentIcon = $derived(icons[`${value.field.toString()}-${value.order}`]);

	const menuState = new ModalState();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={buttonVariants({ variant: 'secondary', size: 'sm', className: 'hidden md:flex' })}
	>
		<CurrentIcon class="icon-xs" />
		{value.label}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56">
		<DropdownMenu.Label>Sort by</DropdownMenu.Label>
		<DropdownMenu.Separator />

		<DropdownMenu.Group>
			{#each options as option}
				{@const Icon = icons[`${option.field.toString()}-${option.order}`]}
				<DropdownMenu.CheckboxItem
					checked={value.field === option.field && value.order === option.order}
					onclick={() => (value = { ...option })}
				>
					<Icon class="icon-xs mr-2" />
					{option.label}
				</DropdownMenu.CheckboxItem>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
<Drawer.Root bind:open={menuState.isOpen}>
	<Drawer.Trigger
		class={buttonVariants({ variant: 'secondary', size: 'icon', className: 'md:hidden' })}
	>
		<CurrentIcon />
	</Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Header class="pt-2 pb-0">
			<span class="flex items-center gap-x-2">
				<span class="p-1.5 rounded-md bg-secondary">
					<ArrowUpDown class="icon-sm" />
				</span>
				<Drawer.Title class="text-left">Sort By</Drawer.Title>
			</span>
		</Drawer.Header>
		<Drawer.Footer class="pt-2 pb-0 px-0">
			<RadioGroup.Root value={`${value.field.toString()}-${value.order}`} class="px-0 py-1 gap-y-0">
				{#each options as option}
					{@const optValue = `${option.field.toString()}-${option.order}`}
					{@const Icon = icons[optValue]}
					<Label
						for={optValue}
						class="w-full flex items-center justify-between px-4 py-1 hover:bg-secondary/40"
					>
						<Icon class="icon-xs mr-2" />
						<!-- TODO: Consider altenative labels -->
						<span class="grow font-semibold text-base">
							{option.label}
						</span>
						<RadioGroup.Item
							class="sr-only"
							id={optValue}
							value={optValue}
							onclick={() => {
								value = { ...option };
								menuState.close();
							}}
						/>
						<Check
							class={cn(
								'size-5',
								optValue !== `${value.field.toString()}-${value.order}` && 'text-transparent'
							)}
						/>
					</Label>
				{/each}
			</RadioGroup.Root>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
