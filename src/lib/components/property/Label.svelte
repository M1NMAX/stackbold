<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Copy, MoreHorizontal, Pen, Trash } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	export let id: string;
	export let name: string;

	const dispatch = createEventDispatcher<{ duplicate: string; edit: string; delete: string }>();
</script>

<label
	for={id}
	class="grow flex justify-between items-center py-1 px-0.5 font-semibold text-base select-none"
>
	<span class="label-text"> {name}</span>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger asChild let:builder>
			<Button builders={[builder]} variant="outline" size="xs">
				<MoreHorizontal class="icon-xs" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-56">
			<DropdownMenu.Group>
				<DropdownMenu.Item on:click={() => dispatch('edit', id)} class="space-x-1">
					<Pen class="icon-xs" />
					<span> Edit item </span>
				</DropdownMenu.Item>

				<DropdownMenu.Item on:click={() => dispatch('duplicate', id)} class="space-x-1">
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</DropdownMenu.Item>

				<DropdownMenu.Separator />
				<DropdownMenu.Item on:click={() => dispatch('delete', id)} class="space-x-1">
					<Trash class="icon-xs" />
					<span>Delete</span>
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</label>
