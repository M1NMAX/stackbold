<script context="module" lang="ts">
	import {
		ArrowDownAZ,
		ArrowDownZA,
		ArrowUpDown,
		CalendarArrowDown,
		CalendarArrowUp,
		ClockArrowDown,
		ClockArrowUp
	} from 'lucide-svelte';

	const icons: { [idx: string]: any } = {
		'name-asc': ArrowDownAZ,
		'name-desc': ArrowDownZA,
		'updatedAt-asc': ClockArrowDown,
		'updatedAt-desc': ClockArrowUp,
		'createdAt-asc': CalendarArrowDown,
		'createdAt-desc': CalendarArrowUp
	};
</script>

<script lang="ts">
	import { getScreenState } from '$lib/components/view';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Label } from '$lib/components/ui/label';
	import type { SortOption } from '$lib/utils/sort';

	type T = $$Generic;

	export let sortOptions: SortOption<T>[];
	export let currentSort: SortOption<T>;

	let isOpen = false;
	const isDesktop = getScreenState();
</script>

{#if $isDesktop}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger asChild let:builder>
			<Button builders={[builder]} variant="secondary" size="sm" class="h-9 w-44">
				<svelte:component
					this={icons[`${currentSort.field.toString()}-${currentSort.order}`]}
					class="icon-xs mr-2"
				/>
				{currentSort.label}
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-56">
			<DropdownMenu.Label>Sort by</DropdownMenu.Label>
			<DropdownMenu.Separator />

			<DropdownMenu.Group>
				{#each sortOptions as option}
					<DropdownMenu.CheckboxItem
						checked={currentSort.field === option.field && currentSort.order === option.order}
						on:click={() => (currentSort = { ...option })}
					>
						<svelte:component
							this={icons[`${option.field.toString()}-${option.order}`]}
							class="icon-xs mr-2"
						/>
						{option.label}
					</DropdownMenu.CheckboxItem>
				{/each}
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<Drawer.Root bind:open={isOpen}>
		<Drawer.Trigger asChild let:builder>
			<Button builders={[builder]} variant="secondary">
				<!-- <ArrowUpDown class="icon-sm" /> -->
				<svelte:component
					this={icons[`${currentSort.field.toString()}-${currentSort.order}`]}
					class="icon-sm mr-2"
				/>
			</Button>
		</Drawer.Trigger>
		<Drawer.Content>
			<Drawer.Header class="py-1">
				<div class="flex items-center space-x-2">
					<div class="p-2.5 rounded bg-secondary">
						<ArrowUpDown class="icon-sm" />
					</div>
					<div class="text-base font-semibold">Sort By</div>
				</div>
			</Drawer.Header>
			<Drawer.Footer>
				<RadioGroup.Root
					id="sort"
					value={`${currentSort.field.toString()}-${currentSort.order}`}
					class="px-2 py-1 rounded-md bg-secondary/40"
				>
					{#each sortOptions as option}
						<Label class="flex items-center justify-between space-x-2">
							<span class="flex items-center font-semibold text-lg">
								<svelte:component
									this={icons[`${option.field.toString()}-${option.order}`]}
									class="icon-sm mr-2"
								/>

								{option.label}
							</span>
							<RadioGroup.Item
								value={`${option.field.toString()}-${option.order}`}
								id={option.label}
								on:click={() => {
									isOpen = false;
									currentSort = { ...option };
								}}
							/>
						</Label>
					{/each}
				</RadioGroup.Root></Drawer.Footer
			>
		</Drawer.Content>
	</Drawer.Root>
{/if}
