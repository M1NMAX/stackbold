<script lang="ts">
	import { Copy, MoreHorizontal, PanelLeftOpen, Trash } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import { cn } from '$lib/utils';
	import { getScreenState } from '$lib/components/view';
	import { getDeleteModalState } from '$lib/components/modal';
	import { getItemState } from '.';

	type Props = {
		itemId: string;
		class?: string;
		clickOpenItem: (id: string) => void;
	};

	let { itemId, class: className, clickOpenItem }: Props = $props();

	let open = $state(false);

	const itemState = getItemState();
	const isDesktop = getScreenState();
	const deleteModal = getDeleteModalState();

	function deleteItem() {
		if (open) open = false;
		deleteModal.openModal({ type: 'item', id: itemId });
	}

	function clickDrawerBtn(fun: (id: string) => void) {
		open = false;
		fun(itemId);
	}
</script>

{#if $isDesktop}
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
				<DropdownMenu.Item on:click={() => clickOpenItem(itemId)}>
					<PanelLeftOpen class="icon-xs" />
					<span> Open in side </span>
				</DropdownMenu.Item>

				<DropdownMenu.Item on:click={() => itemState.duplicateItem(itemId)}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item on:click={() => deleteItem()} class="group">
					<Trash class="icon-xs group-hover:text-primary" />
					<span class="group-hover:text-primary">Delete</span>
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="ghost"
				size="xs"
				class={cn(className, open && 'visible bg-accent')}
			>
				<MoreHorizontal />
			</Button>
		</Drawer.Trigger>
		<Drawer.Content>
			<Drawer.Footer>
				<Button variant="secondary" on:click={() => clickDrawerBtn(clickOpenItem)}>
					<PanelLeftOpen class="icon-xs" />
					<span> Open </span>
				</Button>

				<Button variant="secondary" on:click={() => itemState.duplicateItem(itemId)}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</Button>
				<Button variant="destructive" on:click={() => deleteItem()} class="group">
					<Trash class="icon-xs group-hover:text-primary" />
					<span>Delete</span>
				</Button>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
