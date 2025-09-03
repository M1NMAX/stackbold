<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Copy from 'lucide-svelte/icons/copy';
	import X from 'lucide-svelte/icons/x';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Trash from 'lucide-svelte/icons/trash';
	import { Button, buttonVariants, Drawer, HSeparator } from '$lib/components/base/index.js';
	import { getItemState } from '$lib/components/items/index.js';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page/index.js';
	import { getPropertyState, getRefValue, PropertyInput } from '$lib/components/property/index.js';
	import {
		COLLECTION_PAGE_PANEL_CTX_KEY,
		DEBOUNCE_INTERVAL,
		MAX_ITEM_NAME_LENGTH
	} from '$lib/constant/index.js';
	import type { RouterInputs } from '$lib/trpc/router.js';
	import debounce from 'debounce';
	import { getContext, tick } from 'svelte';
	import { textareaAutoSize } from '$lib/actions/index.js';
	import { tm, useId } from '$lib/utils/index.js';
	import type { PropertyRef } from '@prisma/client';

	let { data } = $props();

	const propertyState = getPropertyState();
	const itemState = getItemState();
	let item = $derived(getCurrentItem());

	let isSmHeadingVisible = $state(false);

	const menuState = new ModalState();
	const deleteModal = getDeleteModalState();
	const nameId = useId();

	const panelState = getContext<ModalState>(COLLECTION_PAGE_PANEL_CTX_KEY);
	function goBack(forceRename: boolean = true) {
		if (forceRename) forceItemRename();
		history.back();
		itemState.active = null;
		if (data.insidePanel) {
			panelState.close();
		}
	}

	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}

	async function updItem(args: Omit<RouterInputs['items']['update'], 'id'>) {
		await itemState.updItem({ id: item.id, ...args });
	}

	const updItemDebounced = debounce(updItem, DEBOUNCE_INTERVAL);

	async function handleUpdItemName(e: Event) {
		const targetEl = e.currentTarget as HTMLTextAreaElement;
		updItemDebounced({ name: targetEl.value });
	}

	function forceItemRename() {
		if (item.name.trim() !== '') return;
		updItem({ name: 'Untitled' });
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
				goBack(false);
				await itemState.deleteItem(item.id);
			}
		});
	}
	async function updPropertyRef(ref: PropertyRef) {
		await itemState.updPropertyRef(item.id, ref);
	}

	function getCurrentItem() {
		return itemState.items.find((item) => item.id === data.id)!;
	}

	$effect(() => {
		if (panelState.isOpen) {
			const inputEl = document.getElementById(nameId) as HTMLTextAreaElement;
			tick().then(() => inputEl.focus());
		}
	});
</script>

{#if data.insidePanel}
	<div
		class={tm(
			'flex items-center justify-between space-x-1 p-4 pb-2',
			!isSmHeadingVisible && 'justify-end'
		)}
	>
		<p class={tm('grow text-xl font-semibold', isSmHeadingVisible ? 'visible' : 'hidden')}>
			{item.name.length > 44 ? item.name.substring(0, 44) + '...' : item.name}
		</p>

		<Button theme="secondary" variant="icon" onclick={() => goBack()}>
			<X />
		</Button>
	</div>
	<div class="grow flex flex-col px-4 overflow-y-auto hd-scroll" onscroll={handleScroll}>
		{@render nameInput()}

		<div class="space-y-2">
			{@render properties()}
		</div>
	</div>

	{@render bottomMenu()}
{:else}
	<PageContainer>
		<PageHeader class="flex items-center justify-between">
			<Button theme="secondary" variant="icon" onclick={() => goBack()}>
				<ChevronLeft />
			</Button>
			<h1 class={tm('grow font-semibold text-xl', isSmHeadingVisible ? 'visible' : 'hidden')}>
				{item.name}
			</h1>

			{@render topMenu()}
		</PageHeader>

		<PageContent class="grow" onscroll={handleScroll}>
			{@render nameInput()}
			{@render properties()}
		</PageContent>
		{@render bottomMenu()}
	</PageContainer>
{/if}

{#snippet nameInput()}
	<textarea
		id={nameId}
		use:textareaAutoSize
		class="textarea textarea-ghost textarea-xl"
		value={item.name}
		oninput={handleUpdItemName}
		maxlength={MAX_ITEM_NAME_LENGTH}
		spellcheck={false}
		placeholder="New item"
	></textarea>
{/snippet}

{#snippet properties()}
	{#each propertyState.properties as property}
		<PropertyInput
			{property}
			value={getRefValue(item.properties, property.id)}
			onchange={(value) => updPropertyRef({ id: property.id, value })}
		/>
	{/each}
{/snippet}

{#snippet topMenu()}
	<button
		onclick={() => menuState.toggle()}
		class={buttonVariants({ theme: 'secondary', variant: 'icon', className: 'md:hidden' })}
	>
		<Ellipsis />
	</button>
	<Drawer bind:open={menuState.isOpen}>
		<Button theme="ghost" variant="menu" onclick={() => duplicateItem()}>
			<Copy />
			<span>Duplicate item </span>
		</Button>

		<HSeparator />

		<Button theme="danger" variant="menu" onclick={() => deleteItem()}>
			<Trash />
			<span>Delete item</span>
		</Button>
	</Drawer>
{/snippet}

{#snippet bottomMenu()}
	<div class="hidden md:block px-4 pb-4">
		<HSeparator />
		<div class="flex items-center justify-end gap-x-1.5">
			<Button theme="secondary" onclick={() => duplicateItem()}>
				<Copy />
				<span> Duplicate</span>
			</Button>

			<Button theme="secondary" class="hover:text-red-500" onclick={() => deleteItem()}>
				<Trash />
				<span> Delete</span>
			</Button>
		</div>
	</div>
{/snippet}
