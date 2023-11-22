<script lang="ts">
	import { Copy, MoreHorizontal, PanelLeftOpen, Pencil, Trash } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	import { createEventDispatcher } from 'svelte';

	export let itemId: string;

	const dispatch = createEventDispatcher<{
		clickOpenItem: string;
		clickRenameItem: string;
		clickDuplicateItem: string;
		clickDeleteItem: string;
	}>();
	// class="invisible group-hover:visible"
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button builders={[builder]} variant="ghost" size="xs"><MoreHorizontal /></Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56">
		<DropdownMenu.Group>
			<DropdownMenu.Item on:click={() => dispatch('clickOpenItem', itemId)} class="space-x-2">
				<PanelLeftOpen class="icon-xs" />
				<span> Open in side </span>
			</DropdownMenu.Item>

			<DropdownMenu.Item on:click={() => dispatch('clickRenameItem', itemId)} class="space-x-2">
				<Pencil class="icon-xs" />
				<span> Rename </span>
			</DropdownMenu.Item>

			<DropdownMenu.Item on:click={() => dispatch('clickDuplicateItem', itemId)} class="space-x-2">
				<Copy class="icon-xs" />
				<span>Duplicate</span>
			</DropdownMenu.Item>

			<DropdownMenu.Item on:click={() => dispatch('clickDeleteItem', itemId)} class="space-x-2">
				<Trash class="icon-xs" />
				<span>Delete</span>
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
