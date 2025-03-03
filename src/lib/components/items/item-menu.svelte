<script lang="ts">
	import { Copy, MoreHorizontal, PanelLeftOpen, Trash } from 'lucide-svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import { cn } from '$lib/utils';
	import { getScreenSizeState } from '$lib/components/screen';
	import { getDeleteModalState } from '$lib/components/modal';
	import { getItemState } from '.';

	type Props = {
		id: string;
		name: string;
		class?: string;
		clickOpenItem: (id: string) => void;
	};

	let { id, name, class: className, clickOpenItem }: Props = $props();

	let open = $state(false);

	const itemState = getItemState();

	const isLargeScreen = getScreenSizeState();
	const deleteModal = getDeleteModalState();

	function deleteItem() {
		if (open) open = false;
		deleteModal.open({
			type: 'item',
			id,
			name,
			fun: async () => {
				await itemState.deleteItem(id);
			}
		});
	}

	async function duplicateItem() {
		if (open) open = false;
		await itemState.duplicateItem(id);
	}

	function openItem() {
		if (open) open = false;
		clickOpenItem(id);
	}
</script>

{#if isLargeScreen.current}
	<DropdownMenu.Root bind:open>
		<DropdownMenu.Trigger
			class={buttonVariants({
				variant: 'ghost',
				size: 'xs',
				className: cn(className, open && 'visible bg-accent')
			})}
		>
			<MoreHorizontal class="icon-sm" />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-56">
			<DropdownMenu.Group>
				<DropdownMenu.Item onclick={() => openItem()}>
					<PanelLeftOpen class="icon-xs" />
					<span> Open in side </span>
				</DropdownMenu.Item>

				<DropdownMenu.Item onclick={() => duplicateItem()}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item onclick={() => deleteItem()} class="group">
					<Trash class="icon-xs group-hover:text-primary" />
					<span class="group-hover:text-primary">Delete</span>
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Trigger
			class={buttonVariants({
				variant: 'ghost',
				size: 'xs',
				className: cn(className, open && 'visible bg-accent')
			})}
		>
			<MoreHorizontal />
		</Drawer.Trigger>
		<Drawer.Content>
			<Drawer.Footer>
				<Button variant="secondary" onclick={() => openItem()}>
					<PanelLeftOpen class="icon-xs" />
					<span> Open </span>
				</Button>

				<Button variant="secondary" onclick={() => duplicateItem()}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</Button>
				<Button variant="destructive" onclick={() => deleteItem()} class="group">
					<Trash class="icon-xs group-hover:text-primary" />
					<span>Delete</span>
				</Button>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
