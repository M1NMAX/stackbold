<script lang="ts">
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import X from 'lucide-svelte/icons/x';
	import { ModalState } from '$lib/states/index.js';
	import {
		PageContainer,
		PageContent,
		PageFooter,
		PageHeader,
		PageTitle
	} from '$lib/components/page/index.js';
	import { AddProperty, getPropertyState, PropertyEditor } from '$lib/components/property/index.js';
	import { Breadcrumb, BreadcrumbItem, Button } from '$lib/components/base/index.js';
	import { COLLECTION_PAGE_PANEL_CTX_KEY } from '$lib/constant/index.js';
	import { capitalizeFirstLetter, tm } from '$lib/utils/index.js';
	import { getContext } from 'svelte';
	import { AddView, getViewState, ViewEditor } from '$lib/components/view/index.js';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';
	import { getCollectionState, getCollectionView } from '$lib/components/collection/index.js';

	const Tabs = { PROPERTIES: 'PROPERTIES', VIEWS: 'VIEWS' } as const;
	type Tab = (typeof Tabs)[keyof typeof Tabs];

	let { data } = $props();

	const collectionState = getCollectionState();
	const viewState = getViewState();
	const propertyState = getPropertyState();
	const panelState = getContext<ModalState>(COLLECTION_PAGE_PANEL_CTX_KEY);
	const collection = $derived(collectionState.getCollection(data.cid)!);

	let openedPropertyEditor = $state<string | null>(null);
	let openedViewEdit = $state<string | null>(null);
	let isSmHeadingVisible = $state(false);
	let currentTab = $state<Tab>(Tabs.PROPERTIES);

	function goBack() {
		history.back();
		if (data.insidePanel) {
			panelState.close();
		}
	}

	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}

	function isTabSelected(tab: Tab) {
		return currentTab === tab;
	}

	function selectTab(tab: Tab) {
		currentTab = tab;
	}
</script>

<svelte:head>
	<title>Collection Settings - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader
		class={tm(!isSmHeadingVisible && data.insidePanel ? 'justify-end' : 'justify-between')}
	>
		{#if data.insidePanel}
			<PageTitle
				small
				icon="settings"
				title="Settings"
				class={tm(isSmHeadingVisible ? 'grow' : 'hidden')}
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
				<BreadcrumbItem icon="settings" name="Settings" last />
			</Breadcrumb>
			<PageTitle
				small
				icon="settings"
				title="Settings"
				class={isSmHeadingVisible ? 'grow flex lg:hidden' : 'hidden'}
			/>
		{/if}
	</PageHeader>
	<PageContent onscroll={handleScroll}>
		<PageTitle icon="settings" title="Settings" />
		<div class="flex flex-col gap-y-1">
			<div role="tablist" class="w-full flex rounded-md mb-2 bg-secondary/50">
				{#each Object.values(Tabs) as tab (tab)}
					<button
						type="button"
						role="tab"
						tabindex={isTabSelected(tab) ? 0 : -1}
						onclick={() => selectTab(tab)}
						class={tm(
							'h-10 grow flex items-center justify-center whitespace-nowrap rounded-t-md px-2 py-1.5 font-semibold transition-all',
							isTabSelected(tab) && 'bg-secondary shadow-sm border-b-2 border-primary'
						)}
					>
						{capitalizeFirstLetter(tab)}
					</button>
				{/each}
			</div>

			<div
				tabindex="0"
				role="tabpanel"
				class="w-full grow flex flex-col justify-between overflow-y-hidden"
			>
				{#if currentTab === Tabs.PROPERTIES}
					{@render propertiesEditors()}
				{:else if currentTab === Tabs.VIEWS}
					{@render viewsEditors()}
				{/if}
			</div>
		</div>
	</PageContent>
	<PageFooter>
		{#if currentTab === Tabs.PROPERTIES}
			<AddProperty refresh={data.insidePanel} />
		{:else if currentTab === Tabs.VIEWS}
			<AddView />
		{/if}
	</PageFooter>
</PageContainer>

{#snippet viewsEditors()}
	<div class="grow overflow-y-auto space-y-1">
		{#each viewState.views as view (view.id)}
			<ViewEditor
				{view}
				isOpen={openedViewEdit === view.id}
				openChange={(value) => (openedViewEdit = value)}
			/>
		{/each}
	</div>
{/snippet}

{#snippet propertiesEditors()}
	<div class="grow overflow-y-auto space-y-1">
		{#each propertyState.properties as property (property.id)}
			<PropertyEditor
				{property}
				isOpen={openedPropertyEditor === property.id}
				openChange={(value) => (openedPropertyEditor = value)}
			/>
		{:else}
			<div class="h-full flex flex-col items-center justify-center space-y-2">
				<p class="text-center text-lg">This collection has no properties. <br /> Please add one</p>
				<ArrowDown class="size-9" />
			</div>
		{/each}
	</div>
{/snippet}
