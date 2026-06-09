<script lang="ts">
	import Copy from '@lucide/svelte/icons/copy';
	import X from '@lucide/svelte/icons/x';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Trash from '@lucide/svelte/icons/trash';
	import {
		AdaptiveWrapper,
		Breadcrumb,
		BreadcrumbItem,
		Button,
		buttonVariants,
		HSeparator
	} from '$lib/components/base/index.js';
	import { getItemState } from '$lib/components/item/index.js';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';
	import { PageContainer, PageFooter } from '$lib/components/page/index.js';
	import { getPropertyState, PropertyInput } from '$lib/components/property/index.js';
	import {
		COLLECTION_PAGE_PANEL_CTX_KEY,
		DEBOUNCE_INTERVAL,
		MAX_ITEM_NAME_LENGTH,
		NAME_FIELD
	} from '$lib/constant/index.js';
	import type { RouterInputs } from '$lib/trpc/router.js';
	import debounce from 'debounce';
	import { getContext } from 'svelte';
	import { getPropertyRefValue, tm } from '$lib/utils/index.js';
	import type { PropertyRef } from '@prisma/client';
	import { getViewState } from '$lib/components/view/index.js';
	import { getCollectionState, getCollectionView } from '$lib/components/collection/index.js';
	import { autosizeTextarea } from '$lib/actions/index.js';

	let { data } = $props();

	let isReady = $state(false);
	const collectionState = getCollectionState();
	const viewState = getViewState();
	const propertyState = getPropertyState();
	const itemState = getItemState();
	const item = $derived(itemState.getItem(data.iid)!);
	const collection = $derived(collectionState.getCollection(item.collectionId)!);
	const view = $derived(viewState.getViewByShortId(viewState.viewShortId)!);

	const menuState = new ModalState();
	const deleteModal = getDeleteModalState();

	const panelState = getContext<ModalState>(COLLECTION_PAGE_PANEL_CTX_KEY);
	function goBack(forceRename: boolean = true) {
		if (forceRename) forceItemRename();
		history.back();
		itemState.active = null;
		if (data.insidePanel) panelState.close();
	}

	async function updItem(args: Omit<RouterInputs['items']['update'], 'id'>) {
		await itemState.updItem({ id: item.id, ...args }, shouldRefresh(NAME_FIELD));
	}

	const updItemDebounced = debounce(updItem, DEBOUNCE_INTERVAL);

	async function handleUpdItemName(e: Event) {
		const targetEl = e.currentTarget as HTMLTextAreaElement;
		updItemDebounced({ name: targetEl.value });
	}

	async function forceItemRename() {
		if (item.name.trim() !== '') return;
		await updItem({ name: 'Untitled' });
	}

	async function duplicateItem() {
		if (menuState.isOpen) menuState.close();
		await itemState.duplicateItem(item.id, data.insidePanel);
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
		await itemState.updPropertyRef(item.id, ref, shouldRefresh(ref.id));
	}

	function shouldRefresh(field: string) {
		if (!data.insidePanel) return false;

		return (
			view.groupBy === field ||
			view.sorts.some((s) => s.field === field) ||
			view.filters.some((f) => f.id === field)
		);
	}

	$effect(() => {
		if (!data.insidePanel) {
			isReady = true;
			return;
		}

		const timer = setTimeout(() => {
			isReady = true;
		}, 100);

		return () => clearTimeout(timer);
	});
</script>

<PageContainer title={item ? item.name : ''} sidebar={!data.insidePanel}>
	{#snippet topActions()}
		{#if data.insidePanel}
			<Button theme="secondary" variant="icon" onclick={() => goBack()}>
				<X />
			</Button>
		{:else}
			{@render menu()}
		{/if}
	{/snippet}

	{#snippet breadcrumbs()}
		{#if !data.insidePanel}
			<Breadcrumb class="hidden lg:flex">
				<BreadcrumbItem icon="collections" name="Collections" link="/collections" />
				<BreadcrumbItem
					icon={collection.icon}
					name={collection.name}
					link={`/collections/${collection.id}?view=${getCollectionView(collection)}`}
				/>
				<BreadcrumbItem icon="item" name={item.name} last />
			</Breadcrumb>
		{/if}
	{/snippet}

	{#snippet actionsRow()}
		{#key isReady}
			<textarea
    			{@attach autosizeTextarea(`item-${item.id}-name`)}
				name="name"
				value={item.name}
				oninput={handleUpdItemName}
				spellcheck={false}
				maxlength={MAX_ITEM_NAME_LENGTH}
				placeholder="Name"
				class="textarea ghost xl"
			></textarea>
		{/key}
	{/snippet}

	{#key isReady}
		{#each propertyState.properties as property}
			<PropertyInput
				{property}
				value={getPropertyRefValue(item.properties, property.id)}
				onchange={(value) => updPropertyRef({ id: property.id, value })}
				itemId={item.id}
			/>
		{/each}
	{/key}

	{#snippet footer()}
		{#if data.insidePanel}
			<PageFooter class="flex items-center justify-end">
				{@render menu()}
			</PageFooter>
		{/if}
	{/snippet}
</PageContainer>

{#snippet menu()}
	<AdaptiveWrapper
		bind:open={menuState.isOpen}
		floatingAlign="end"
		triggerClass={buttonVariants({ theme: 'secondary', variant: 'icon' })}
	>
		{#snippet trigger()}
			<Ellipsis />
		{/snippet}

		<Button theme="ghost" variant="menu" onclick={() => duplicateItem()}>
			<Copy />
			<span>Duplicate </span>
		</Button>

		<HSeparator />

		<Button theme="danger" variant="menu" onclick={() => deleteItem()}>
			<Trash />
			<span>Delete </span>
		</Button>
	</AdaptiveWrapper>
{/snippet}
