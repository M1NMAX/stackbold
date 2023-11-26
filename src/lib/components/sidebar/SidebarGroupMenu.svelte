<script lang="ts">
	import { Copy, MoreHorizontal, Pencil, Trash } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	import { createEventDispatcher } from 'svelte';

	export let groupId: string;

	const dispatch = createEventDispatcher<{
		clickRenameGroup: { id: string };
		clickDuplicateGroup: { id: string };
		clickDeleteGroup: { id: string };
	}>();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="ghost"
			size="xs"
			class="invisible group-hover:visible transition-opacity"
		>
			<MoreHorizontal class="icon-xs" />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56">
		<DropdownMenu.Group>
			<DropdownMenu.Item
				on:click={() => dispatch('clickRenameGroup', { id: groupId })}
				class="space-x-2"
			>
				<Pencil class="icon-xs" />
				<span> Rename </span>
			</DropdownMenu.Item>

			<DropdownMenu.Item
				on:click={() => dispatch('clickDuplicateGroup', { id: groupId })}
				class="space-x-2"
			>
				<Copy class="icon-xs" />
				<span>Duplicate</span>
			</DropdownMenu.Item>

			<DropdownMenu.Item
				on:click={() => dispatch('clickDeleteGroup', { id: groupId })}
				class="space-x-2"
			>
				<Trash class="icon-xs" />
				<span>Delete</span>
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
