<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Copy from 'lucide-svelte/icons/copy';
	import X from 'lucide-svelte/icons/x';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Trash from 'lucide-svelte/icons/trash';
	import {
		AdaptiveWrapper,
		Breadcrumb,
		BreadcrumbItem,
		Button,
		buttonVariants,
		HSeparator,
		TextareaAutosize
	} from '$lib/components/base/index.js';
	import { getItemState } from '$lib/components/items/index.js';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';
	import {
		PageContainer,
		PageContent,
		PageFooter,
		PageHeader,
		PageTitle
	} from '$lib/components/page/index.js';
	import { getPropertyState, getRefValue, PropertyInput } from '$lib/components/property/index.js';
	import {
		COLLECTION_PAGE_PANEL_CTX_KEY,
		DEBOUNCE_INTERVAL,
		MAX_ITEM_NAME_LENGTH,
		NAME_FIELD
	} from '$lib/constant/index.js';
	import type { RouterInputs } from '$lib/trpc/router.js';
	import debounce from 'debounce';
	import { getContext } from 'svelte';
	import { tm } from '$lib/utils/index.js';
	import type { PropertyRef } from '@prisma/client';
	import { getViewState } from '$lib/components/view/index.js';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';
	import { getCollectionState, getCollectionView } from '$lib/components/collection/index.js';

	let { data } = $props();

	let isSmHeadingVisible = $state(false);
	const collectionState = getCollectionState();
	const viewState = getViewState();
	const propertyState = getPropertyState();
	const itemState = getItemState();
	const item = $derived(itemState.getItem(data.id)!);
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

	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
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
</script>

<svelte:head>
	<title>Collection Item - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader
		class={tm(!isSmHeadingVisible && data.insidePanel ? 'justify-end' : 'justify-between')}
	>
		{#if data.insidePanel}
			<PageTitle
				small
				icon="item"
				title={item.name}
				class={tm(isSmHeadingVisible ? 'flex-1' : 'hidden')}
			/>
			<Button theme="secondary" variant="icon" onclick={() => goBack()}>
				<X />
			</Button>
		{:else}
			<SidebarOpenBtn />
			<Button theme="secondary" variant="icon" class="lg:hidden" onclick={() => goBack()}>
				<ChevronLeft />
			</Button>
			<Breadcrumb class="hidden lg:flex">
				<BreadcrumbItem icon="collections" name="Collections" link="/collections" />
				<BreadcrumbItem
					icon={collection.icon}
					name={collection.name}
					link={`/collections/${collection.id}?view=${getCollectionView(collection)}`}
				/>
				<BreadcrumbItem icon="item" name={item.name} last />
			</Breadcrumb>
			<PageTitle
				icon="item"
				title={item.name}
				class={isSmHeadingVisible ? 'grow flex lg:hidden' : 'hidden'}
				small
			/>

			{@render menu()}
		{/if}
	</PageHeader>

	<PageContent onscroll={handleScroll}>
		<TextareaAutosize
			name="name"
			value={item.name}
			oninput={handleUpdItemName}
			spellcheck={false}
			maxlength={MAX_ITEM_NAME_LENGTH}
			placeholder="New item"
			ghost
			xl
		/>
		{#each propertyState.properties as property}
			<PropertyInput
				{property}
				value={getRefValue(item.properties, property.id)}
				onchange={(value) => updPropertyRef({ id: property.id, value })}
				itemId={item.id}
			/>
		{/each}
	</PageContent>
	<PageFooter class={tm(data.insidePanel ? 'flex justify-end' : 'hidden')}>
		{@render menu()}
	</PageFooter>
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
