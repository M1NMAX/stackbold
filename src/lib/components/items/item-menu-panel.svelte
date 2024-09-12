<script lang="ts">
	import { Copy, File, MoreHorizontal, Trash } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import { createEventDispatcher } from 'svelte';
	import { getScreenState } from '$lib/components/view';

	export let itemId: string;
	export let collectionName: string;
	export let itemName: string;

	let open: boolean;

	const isDesktop = getScreenState();
	const dispatch = createEventDispatcher<{
		clickDuplicateItem: string;
		clickDeleteItem: string;
	}>();

	type Ev = 'clickDuplicateItem' | 'clickDeleteItem';
	function clickDrawerBtn(ev: Ev) {
		open = false;
		dispatch(ev, itemId);
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
				<DropdownMenu.Item on:click={() => dispatch('clickDuplicateItem', itemId)}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item on:click={() => dispatch('clickDeleteItem', itemId)} class="group">
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
				<Button variant="secondary" on:click={() => clickDrawerBtn('clickDuplicateItem')}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</Button>
				<Button variant="destructive" on:click={() => clickDrawerBtn('clickDeleteItem')}>
					<Trash class="icon-xs" />
					<span>Delete</span>
				</Button>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
