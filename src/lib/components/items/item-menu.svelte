<script lang="ts">
	import { Copy, MoreHorizontal, PanelLeftOpen, Pencil, Trash } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { createEventDispatcher } from 'svelte';
	import { cn } from '$lib/utils';

	export let itemId: string;
	let className: string | undefined = undefined;
	export { className as class };
	let open: boolean;

	const dispatch = createEventDispatcher<{
		clickOpenItem: string;
		clickDuplicateItem: string;
		clickDeleteItem: string;
	}>();
</script>

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="ghost"
			size="xs"
			class={cn(className, open && 'visible bg-accent')}
		>
			<MoreHorizontal />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56">
		<DropdownMenu.Group>
			<DropdownMenu.Item on:click={() => dispatch('clickOpenItem', itemId)} class="space-x-2">
				<PanelLeftOpen class="icon-xs" />
				<span> Open in side </span>
			</DropdownMenu.Item>

			<DropdownMenu.Item on:click={() => dispatch('clickDuplicateItem', itemId)} class="space-x-2">
				<Copy class="icon-xs" />
				<span>Duplicate</span>
			</DropdownMenu.Item>

			<DropdownMenu.Separator />

			<DropdownMenu.Item on:click={() => dispatch('clickDeleteItem', itemId)} class="space-x-2">
				<Trash class="icon-xs" />
				<span>Delete</span>
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
