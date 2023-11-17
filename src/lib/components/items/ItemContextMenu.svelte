<script lang="ts">
	import { Copy, EyeOff, MoreHorizontal, Trash } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	import { createEventDispatcher } from 'svelte';

	export let itemId: string;

	const dispatch = createEventDispatcher<{
		clickOpenItem: string;
		clickHideItem: string;
		clickDuplicateItem: string;
		clickDeleteItem: string;
	}>();
	// class="invisible group-hover:visible"
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button builders={[builder]} variant="outline" size="icon"><MoreHorizontal /></Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56">
		<DropdownMenu.Group>
			<DropdownMenu.Item on:click={() => dispatch('clickHideItem', itemId)}>
				<EyeOff class="mr-2 h-4 w-4" />
				<span> Hide item </span>
			</DropdownMenu.Item>

			<DropdownMenu.Item on:click={() => dispatch('clickDuplicateItem', itemId)}>
				<Copy class="mr-2 h-4 w-4" />
				<span>Duplicate</span>
			</DropdownMenu.Item>

			<DropdownMenu.Item on:click={() => dispatch('clickDeleteItem', itemId)}>
				<Trash class="mr-2 h-4 w-4" />
				<span>Delete</span>
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
