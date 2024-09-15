<script lang="ts">
	import { Copy, File, MoreHorizontal, Trash } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import { getScreenState } from '$lib/components/view';

	type Props = {
		itemId: string;
		itemName: string;
		collectionName: string;

		onClickDuplicate: (id: string) => void;
		onClickDelete: (id: string) => void;
	};

	let { itemId, itemName, collectionName, onClickDuplicate, onClickDelete }: Props = $props();

	let open = $state(false);

	const isDesktop = getScreenState();

	function clickDrawerBtn(fun: (id: string) => void) {
		open = false;
		fun(itemId);
	}
</script>

{#if $isDesktop}
	<DropdownMenu.Root bind:open>
		<DropdownMenu.Trigger asChild let:builder>
			<Button builders={[builder]} variant="secondary" size="icon">
				<MoreHorizontal />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-56">
			<DropdownMenu.Group>
				<DropdownMenu.Item on:click={() => onClickDuplicate(itemId)}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item on:click={() => onClickDelete(itemId)} class="group">
					<Trash class="icon-xs group-hover:text-primary" />
					<span class="group-hover:text-primary">Delete</span>
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Trigger asChild let:builder>
			<Button builders={[builder]} variant="secondary" size="icon">
				<MoreHorizontal />
			</Button>
		</Drawer.Trigger>
		<Drawer.Content>
			<Drawer.Header class="py-2">
				<div class="flex items-center space-x-2 overflow-hidden">
					<div class="p-2.5 rounded bg-secondary">
						<File class="icon-sm" />
					</div>

					<div class="flex flex-col items-start justify-start">
						<div class=" text-base font-semibold truncate">{itemName}</div>
						<div class="text-sm">{collectionName}</div>
					</div>
				</div>
			</Drawer.Header>
			<Drawer.Footer class="pt-2">
				<Button variant="secondary" on:click={() => clickDrawerBtn(onClickDuplicate)}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</Button>
				<Button variant="destructive" on:click={() => clickDrawerBtn(onClickDelete)}>
					<Trash class="icon-xs" />
					<span>Delete</span>
				</Button>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
