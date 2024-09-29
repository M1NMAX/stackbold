<script lang="ts">
	import { getItemState } from '$lib/components/items';
	import { getDeleteModalState, ModalState } from '$lib/components/modal';
	import { PageContainer, PageContent } from '$lib/components/page';
	import { getPropertyState, PropertyInput, PropertyInputWrapper } from '$lib/components/property';
	import { Button } from '$lib/components/ui/button';
	import { getScreenState } from '$lib/components/view';
	import { DEBOUNCE_INTERVAL, ITEM_PANEL_CTX_KEY } from '$lib/constant';
	import type { RouterInputs } from '$lib/trpc/router.js';
	import { cn, preventEnterKeypress } from '$lib/utils';
	import debounce from 'debounce';
	import { ChevronLeft, Copy, X, MoreHorizontal, Trash } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';

	let { data } = $props();

	const isDesktop = getScreenState();
	const propertyState = getPropertyState();
	const itemState = getItemState();
	let item = $derived(getCurrentItem());

	let isSmHeadingVisible = $state(false);
	let renameItemError = $state<string | null>(null);

	const menuState = new ModalState();
	const deleteModal = getDeleteModalState();

	// Utils functions
	function getCurrentItem() {
		return itemState.items.find((item) => item.id === data.id)!;
	}

	const itemPanel = getContext<ModalState>(ITEM_PANEL_CTX_KEY);
	function goBack() {
		history.back();
		itemPanel.closeModal();
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
		const targetEl = e.currentTarget as HTMLParagraphElement;
		const name = targetEl.innerText;

		if (name.length > 50) {
			renameItemError = 'Item name must be at most 50 characters';
			return;
		}

		renameItemError = null;
		updItemDebounced({ name });
	}

	function duplicateItem() {
		if (menuState.isOpen) menuState.closeModal();
		itemState.duplicateItem(item.id);
	}

	function deleteItem() {
		if (menuState.isOpen) menuState.closeModal();
		deleteModal.openModal({
			type: 'item',
			id: item.id,
			name: item.name,
			fun: () => {
				itemState.deleteItem(item.id);
				goBack();
			}
		});
	}
</script>

{#if data.insidePanel}
	<div
		class={cn('flex items-center justify-between space-x-1', !isSmHeadingVisible && 'justify-end')}
	>
		<h2 class={cn('grow text-xl font-semibold', isSmHeadingVisible ? 'visible' : 'hidden')}>
			{item.name.length > 44 ? item.name.substring(0, 44) + '...' : item.name}
		</h2>

		{@render menu()}
		<Button variant="secondary" size="icon" on:click={() => goBack()}>
			<X class="icon-sm" />
		</Button>
	</div>
	<div class="hd-scroll" onscroll={handleScroll}>
		<p
			contenteditable
			spellcheck={false}
			onkeypress={preventEnterKeypress}
			oninput={handleOnInputItemName}
			class="pt-1 pb-2 text-2xl font-semibold break-words focus:outline-none"
		>
			{item.name}
		</p>
		<div class="space-y-2">
			{@render properties()}
		</div>
	</div>
{:else}
	<PageContainer>
		<PageContent>
			<div class="flex justify-between items-center space-x-2">
				<Button variant="secondary" size="icon" on:click={() => history.back()}>
					<ChevronLeft />
				</Button>
				<h1 class={cn('grow font-semibold text-xl', isSmHeadingVisible ? 'visible' : 'hidden')}>
					{item.name}
				</h1>

				{@render menu()}
			</div>

			<div class="hd-scroll" onscroll={handleScroll}>
				<p
					contenteditable
					spellcheck={false}
					onkeypress={preventEnterKeypress}
					oninput={handleOnInputItemName}
					class="pt-1 pb-2 text-2xl font-semibold break-words focus:outline-none"
				>
					{item.name}
				</p>
				<div class="space-y-2">
					{@render properties()}
				</div>
			</div>
		</PageContent>
	</PageContainer>
{/if}

{#snippet properties()}
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
