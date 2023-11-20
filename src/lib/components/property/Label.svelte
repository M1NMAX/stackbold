<script lang="ts">
	import type { CollectionProperty } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';
	import { Copy, EyeOff, MoreHorizontal, Pen, Trash } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	export let property: CollectionProperty;

	const dispatch = createEventDispatcher<{
		duplicate: string;
		edit: string;
		delete: string;
		updPropertyVisibility: { pid: string; name: string; value: boolean };
	}>();
</script>

<label
	for={property.id}
	class="grow flex justify-between items-center py-1 px-0.5 font-semibold text-base select-none"
>
	<span class="label-text"> {property.name}</span>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger asChild let:builder>
			<Button builders={[builder]} variant="outline" size="xs">
				<MoreHorizontal class="icon-xs" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-56">
			<DropdownMenu.Group>
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger class="space-x-1">
						<EyeOff class="icon-xs" />
						<span>Property visibility</span>
					</DropdownMenu.SubTrigger>
					<DropdownMenu.SubContent>
						<DropdownMenu.CheckboxItem
							checked={property.isVisibleOnListView}
							on:click={() => {
								dispatch('updPropertyVisibility', {
									pid: property.id,
									name: 'isVisibleOnListView',
									value: !property.isVisibleOnListView
								});
							}}>List view</DropdownMenu.CheckboxItem
						>

						<DropdownMenu.CheckboxItem
							checked={property.isVisibleOnTableView}
							on:click={() => {
								dispatch('updPropertyVisibility', {
									pid: property.id,
									name: 'isVisibleOnTableView',
									value: !property.isVisibleOnTableView
								});
							}}>Table view</DropdownMenu.CheckboxItem
						>
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>
				<DropdownMenu.Item on:click={() => dispatch('edit', property.id)} class="space-x-1">
					<Pen class="icon-xs" />
					<span> Edit Property </span>
				</DropdownMenu.Item>

				<DropdownMenu.Item on:click={() => dispatch('duplicate', property.id)} class="space-x-1">
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</DropdownMenu.Item>

				<DropdownMenu.Separator />
				<DropdownMenu.Item on:click={() => dispatch('delete', property.id)} class="space-x-1">
					<Trash class="icon-xs" />
					<span>Delete</span>
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</label>
