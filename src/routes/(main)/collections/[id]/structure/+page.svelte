<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import X from '@lucide/svelte/icons/x';
	import { ModalState } from '$lib/states/index.js';
	import { PageContainer, PageFooter } from '$lib/components/page/index.js';
	import { AddProperty, getPropertyState, PropertyEditor } from '$lib/components/property/index.js';
	import {
		Breadcrumb,
		BreadcrumbItem,
		Button,
		Tabs,
		TabTrigger,
		TabContent,
		ExpandableEditor
	} from '$lib/components/base/index.js';
	import { COLLECTION_PAGE_PANEL_CTX_KEY } from '$lib/constant/index.js';
	import { capitalizeFirstLetter } from '$lib/utils/index.js';
	import { getContext } from 'svelte';
	import { AddView, getViewState, ViewEditor } from '$lib/components/view/index.js';
	import { getCollectionState, getCollectionView } from '$lib/components/collection/index.js';

	const TABS_OPTIONS = { PROPERTIES: 'PROPERTIES', VIEWS: 'VIEWS' } as const;
	type Tab = (typeof TABS_OPTIONS)[keyof typeof TABS_OPTIONS];

	let { data } = $props();

	const collectionState = getCollectionState();
	const viewState = getViewState();
	const propertyState = getPropertyState();
	const panelState = getContext<ModalState>(COLLECTION_PAGE_PANEL_CTX_KEY);
	const collection = $derived(collectionState.getCollection(data.cid)!);

	let expandedPropertyEditor = $state<string | null>(null);
	let expandedViewEdit = $state<string | null>(null);
	let currentTab = $state<Tab>(TABS_OPTIONS.PROPERTIES);

	function goBack() {
		history.back();
		if (data.insidePanel) {
			panelState.close();
		}
	}

	function handleTabChange(value: string) {
		currentTab = value as Tab;
	}

	function isPropertyEditorExpanded(pid: string) {
		return expandedPropertyEditor === pid;
	}

	function onclickExpandablePropertyEditor(pid: string) {
		expandedPropertyEditor = isPropertyEditorExpanded(pid) ? null : pid;
	}

	function isViewEditorExpanded(vid: string) {
		return expandedViewEdit === vid;
	}

	function onclickExpandableViewEditor(vid: string) {
		expandedViewEdit = isViewEditorExpanded(vid) ? null : vid;
	}
</script>

<PageContainer
	icon="structure"
	title="Structure"
	sidebar={!data.insidePanel}
	contentClass="px-0 md:px-0"
>
	{#snippet topActions()}
		{#if data.insidePanel}
			<Button theme="secondary" variant="icon" onclick={() => goBack()}>
				<X />
			</Button>
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
				<BreadcrumbItem icon="structure" name="Structure" last />
			</Breadcrumb>
		{/if}
	{/snippet}

	<Tabs value={TABS_OPTIONS.PROPERTIES} onChange={handleTabChange} triggersClass="mx-2 md:mx-4">
		{#snippet triggers()}
			{#each Object.keys(TABS_OPTIONS) as tab}
				{@const value = TABS_OPTIONS[tab as Tab]}
				<TabTrigger {value}>{capitalizeFirstLetter(value)}</TabTrigger>
			{/each}
		{/snippet}

		{#each Object.keys(TABS_OPTIONS) as tab}
			{@const value = TABS_OPTIONS[tab as Tab]}

			<TabContent {value}>
				{#if tab === TABS_OPTIONS.PROPERTIES}
					{@render propertiesEditors()}
				{:else if tab === TABS_OPTIONS.VIEWS}
					{@render viewsEditors()}
				{/if}
			</TabContent>
		{/each}
	</Tabs>

	{#snippet footer()}
		<PageFooter>
			{#if currentTab === TABS_OPTIONS.PROPERTIES}
				<AddProperty refresh={data.insidePanel} />
			{:else if currentTab === TABS_OPTIONS.VIEWS}
				<AddView />
			{/if}
		</PageFooter>
	{/snippet}
</PageContainer>

{#snippet viewsEditors()}
	<div class="grow overflow-y-auto px-2 md:px-4">
		{#each viewState.views as view (view.id)}
			<ExpandableEditor
				icon={view.type}
				name={view.name}
				isExpanded={isViewEditorExpanded(view.id)}
				onclickHeader={() => onclickExpandableViewEditor(view.id)}
				ondragEditor={(dt) => {
					dt.setData('text/plain', view.order.toString());
				}}
				ondropEditor={async (dt) => {
					const start = +dt.getData('text/plain');
					await viewState.orderView(start, view.order);
				}}
			>
				<ViewEditor {view} />
			</ExpandableEditor>
		{/each}
	</div>
{/snippet}

{#snippet propertiesEditors()}
	<div class="grow overflow-y-auto px-2 md:px-4">
		{#each propertyState.properties as property (property.id)}
			<ExpandableEditor
				icon={property.type}
				name={property.name}
				isExpanded={isPropertyEditorExpanded(property.id)}
				onclickHeader={() => onclickExpandablePropertyEditor(property.id)}
				ondragEditor={(dt) => {
					dt.setData('text/plain', property.order.toString());
				}}
				ondropEditor={async (dt) => {
					const start = +dt.getData('text/plain');
					await propertyState.orderProperty(start, property.order);
				}}
			>
				<PropertyEditor {property} />
			</ExpandableEditor>
		{:else}
			<div class="h-full flex flex-col items-center justify-center space-y-2">
				<p class="text-center text-lg">This collection has no properties. <br /> Please add one</p>
				<ArrowDown class="size-9" />
			</div>
		{/each}
	</div>
{/snippet}
