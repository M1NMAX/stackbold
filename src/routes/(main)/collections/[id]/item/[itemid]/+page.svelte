<script lang="ts">
	import { getItemState } from '$lib/components/items';
	import { ModalState } from '$lib/components/modal';
	import { getPropertyState, PropertyInput, PropertyInputWrapper } from '$lib/components/property';
	import { Button } from '$lib/components/ui/button';
	import { ITEM_PANEL_CTX_KEY } from '$lib/constant';
	import { X } from 'lucide-svelte';
	import { getContext } from 'svelte';

	let { data } = $props();

	const propertyState = getPropertyState();
	const itemState = getItemState();
	let item = $derived(getCurrentItem());

	// Utils functions
	function getCurrentItem() {
		return itemState.items.find((item) => item.id === data.id)!;
	}

	const itemPanel = getContext<ModalState>(ITEM_PANEL_CTX_KEY);
	function onClickCloseBtn() {
		history.back();
		itemPanel.closeModal();
	}
</script>

<div class="flex items-center justify-between">
	<!-- TODO: add handler for onInput ev -->
		<h2 class={cn('grow text-xl font-semibold', isSmHeadingVisible ? 'visible' : 'invisble')}>
			{item.name}
		</h2>

		{@render menu()}
		<Button variant="secondary" size="icon" on:click={() => goBack()}>
		<X class="icon-sm" />
	</Button>
</div>
<div class="space-y-2">
	{#each propertyState.properties as property}
		<PropertyInputWrapper {property}>
			<PropertyInput {property} itemId={item.id} />
		</PropertyInputWrapper>
	{/each}
{/snippet}

{#snippet menu()}
	{#if $isDesktop}
		<DropdownMenu.Root bind:open={menuState.isOpen}>
			<DropdownMenu.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" size="icon">
					<MoreHorizontal />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-56">
				<DropdownMenu.Group>
					<DropdownMenu.Item on:click={() => duplicateItem()}>
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
		<Drawer.Root bind:open={menuState.isOpen}>
			<Drawer.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" size="icon">
					<MoreHorizontal />
				</Button>
			</Drawer.Trigger>
			<Drawer.Content>
				<Drawer.Footer class="pt-2">
					<Button variant="secondary" on:click={() => duplicateItem()}>
						<Copy class="icon-xs" />
						<span>Duplicate</span>
					</Button>
					<Button variant="destructive" on:click={() => deleteItem()}>
						<Trash class="icon-xs" />
						<span>Delete</span>
					</Button>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	{/if}
{/snippet}
