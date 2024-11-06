<script lang="ts">
	import { getActiveItemState, getItemState } from '$lib/components/items';
	import { getDeleteModalState, ModalState } from '$lib/components/modal';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { getPropertyState, PropertyInput } from '$lib/components/property';
	import { Button } from '$lib/components/ui/button';
	import { DEBOUNCE_INTERVAL, ITEM_PANEL_CTX_KEY } from '$lib/constant';
	import type { RouterInputs } from '$lib/trpc/router.js';
	import { cn } from '$lib/utils';
	import debounce from 'debounce';
	import { ChevronLeft, Copy, X, MoreHorizontal, Trash } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import { getScreenState } from '$lib/components/screen/screenState.js';

	let { data } = $props();

	const propertyState = getPropertyState();
	const itemState = getItemState();
	let item = $derived(getCurrentItem());

	let isSmHeadingVisible = $state(false);
	let renameItemError = $state<string | null>(null);

	const isDesktop = getScreenState();
	const menuState = new ModalState();
	const deleteModal = getDeleteModalState();
	const activeItem = getActiveItemState();

	// Utils functions
	function getCurrentItem() {
		return itemState.items.find((item) => item.id === data.id)!;
	}

	const itemPanel = getContext<ModalState>(ITEM_PANEL_CTX_KEY);
	function goBack() {
		activeItem.reset();
		history.back();
		if (data.insidePanel) {
			itemPanel.close();
		}
	}

	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}

	async function updItem(data: RouterInputs['items']['update']['data']) {
		await itemState.updItem({ id: item.id, data });
	}

	const updItemDebounced = debounce(updItem, DEBOUNCE_INTERVAL);

	async function handleOnInputItemName(e: Event) {
		const targetEl = e.currentTarget as HTMLInputElement;
		const name = targetEl.value;

		if (name.length > 50) {
			renameItemError = 'Item name must be at most 50 characters';
			return;
		}

		renameItemError = null;
		updItemDebounced({ name });
	}

	function duplicateItem() {
		if (menuState.isOpen) menuState.close();
		itemState.duplicateItem(item.id);
	}

	function deleteItem() {
		if (menuState.isOpen) menuState.close();
		deleteModal.open({
			type: 'item',
			id: item.id,
			name: item.name,
			fun: async () => {
				await itemState.deleteItem(item.id);
				goBack();
			}
		});
	}
</script>

<svelte:head>
	<title>{item.name} - Stackbold</title>
</svelte:head>

{#if data.insidePanel}
	<div
		class={cn('flex items-center justify-between space-x-1', !isSmHeadingVisible && 'justify-end')}
	>
		<p class={cn('grow text-xl font-semibold', isSmHeadingVisible ? 'visible' : 'hidden')}>
			{item.name.length > 44 ? item.name.substring(0, 44) + '...' : item.name}
		</p>

		<Button variant="secondary" on:click={() => goBack()}>
			<X class="icon-sm" />
		</Button>
	</div>
	<div class="grow flex flex-col overflow-y-auto hd-scroll" onscroll={handleScroll}>
		<input
			value={item.name}
			oninput={handleOnInputItemName}
			class="pt-1 pb-2 text-xl font-semibold break-words focus:outline-none bg-inherit"
		/>

		<div class="space-y-2">
			{@render properties()}
		</div>
	</div>

	{@render bottomMenu()}
{:else}
	<PageContainer>
		<PageHeader class="flex items-center justify-between">
			<Button variant="secondary" on:click={() => goBack()}>
				<ChevronLeft class="icon-sm" />
			</Button>
			<h1 class={cn('grow font-semibold text-xl', isSmHeadingVisible ? 'visible' : 'hidden')}>
				{item.name}
			</h1>

			{@render menu()}
		</PageHeader>

		<PageContent class="grow" onScroll={handleScroll}>
			<input
				value={item.name}
				oninput={handleOnInputItemName}
				class="w-full pb-2 text-2xl font-semibold break-words focus:outline-none bg-inherit"
			/>

			{@render properties()}
		</PageContent>
		{@render bottomMenu()}
	</PageContainer>
{/if}

{#snippet properties()}
	{#each propertyState.properties as property}
		<PropertyInput {property} itemId={item.id} />
	{/each}
{/snippet}

{#snippet menu()}
	{#if $isDesktop}
		<DropdownMenu.Root bind:open={menuState.isOpen}>
			<DropdownMenu.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" class="hidden md:block">
					<MoreHorizontal class="icon-sm" />
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
				<Button builders={[builder]} variant="secondary" class="md:hidden">
					<MoreHorizontal class="icon-sm" />
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

{#snippet bottomMenu()}
	<hr />
	<div class="flex items-center justify-end gap-x-1.5">
		<Button variant="secondary" on:click={() => duplicateItem()}>
			<Copy class="icon-xs" />
			<span> Duplicate</span>
		</Button>

		<Button variant="secondary" class="hover:text-primary" on:click={() => deleteItem()}>
			<Trash class="icon-xs" />
			<span> Delete</span>
		</Button>
	</div>
{/snippet}
