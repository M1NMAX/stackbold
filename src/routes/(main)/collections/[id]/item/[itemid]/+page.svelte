<script lang="ts">
	import { getActiveItemState, getItemState } from '$lib/components/items';
	import { getDeleteModalState, ModalState } from '$lib/components/modal';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { getPropertyState, PropertyInput } from '$lib/components/property';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { DEBOUNCE_INTERVAL, ITEM_PANEL_CTX_KEY, MAX_ITEM_NAME_LENGTH } from '$lib/constant';
	import type { RouterInputs } from '$lib/trpc/router.js';
	import { cn } from '$lib/utils';
	import debounce from 'debounce';
	import { ChevronLeft, Copy, X, MoreHorizontal, Trash } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import * as Drawer from '$lib/components/ui/drawer';
	import { textareaAutoSize } from '$lib/actions/textareaAutosize.js';
	import { getNameSchema } from '$lib/schema.js';

	let { data } = $props();

	const propertyState = getPropertyState();
	const itemState = getItemState();
	let item = $derived(getCurrentItem());

	let isSmHeadingVisible = $state(false);
	let renameItemError = $state<string | null>(null);

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

	async function handleUpdItemName(e: Event) {
		const targetEl = e.currentTarget as HTMLTextAreaElement;

		const parseResult = getNameSchema({ label: 'Item name', max: MAX_ITEM_NAME_LENGTH }).safeParse(
			targetEl.value
		);
		if (!parseResult.success) {
			renameItemError = parseResult.error.issues[0].message;
			return;
		}

		renameItemError = null;
		updItemDebounced({ name: targetEl.value });
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

		<Button variant="secondary" size="icon" onclick={() => goBack()}>
			<X />
		</Button>
	</div>
	<div class="grow flex flex-col overflow-y-auto hd-scroll" onscroll={handleScroll}>
		<textarea
			use:textareaAutoSize
			class="textarea textarea-ghost textarea-xl"
			value={item.name}
			oninput={handleUpdItemName}
			maxlength={MAX_ITEM_NAME_LENGTH}
			spellcheck={false}
		></textarea>

		<div class="space-y-2">
			{@render properties()}
		</div>
	</div>

	{@render bottomMenu()}
{:else}
	<PageContainer>
		<PageHeader class="flex items-center justify-between">
			<Button variant="secondary" size="icon" onclick={() => goBack()}>
				<ChevronLeft />
			</Button>
			<h1 class={cn('grow font-semibold text-xl', isSmHeadingVisible ? 'visible' : 'hidden')}>
				{item.name}
			</h1>

			{@render topMenu()}
		</PageHeader>

		<PageContent class="grow" onScroll={handleScroll}>
			<textarea
				use:textareaAutoSize
				class="textarea textarea-ghost textarea-xl"
				value={item.name}
				oninput={handleUpdItemName}
				maxlength={MAX_ITEM_NAME_LENGTH}
				spellcheck={false}
			></textarea>

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

{#snippet topMenu()}
	<Drawer.Root bind:open={menuState.isOpen}>
		<Drawer.Trigger
			class={buttonVariants({ variant: 'secondary', size: 'icon', className: 'md:hidden' })}
		>
			<MoreHorizontal />
		</Drawer.Trigger>
		<Drawer.Content>
			<Drawer.Footer class="pt-2">
				<Button variant="secondary" onclick={() => duplicateItem()}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</Button>
				<Button variant="destructive" onclick={() => deleteItem()}>
					<Trash class="icon-xs" />
					<span>Delete</span>
				</Button>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/snippet}

{#snippet bottomMenu()}
	<div class="hidden md:block px-0.5 pb-0.5">
		<hr class="mb-1.5" />
		<div class="flex items-center justify-end gap-x-1.5">
			<Button variant="secondary" onclick={() => duplicateItem()}>
				<Copy class="icon-xs" />
				<span> Duplicate</span>
			</Button>

			<Button variant="secondary" class="hover:text-red-500" onclick={() => deleteItem()}>
				<Trash class="icon-xs" />
				<span> Delete</span>
			</Button>
		</div>
	</div>
{/snippet}
