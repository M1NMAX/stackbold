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
	import {
		Breadcrumb,
		BreadcrumbItem,
		Button,
		Tabs,
		TabTrigger,
		TabContent
	} from '$lib/components/base/index.js';
	import { COLLECTION_PAGE_PANEL_CTX_KEY } from '$lib/constant/index.js';
	import { capitalizeFirstLetter, tm } from '$lib/utils/index.js';
	import { getContext } from 'svelte';
	import { AddView, getViewState, ViewEditor } from '$lib/components/view/index.js';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';
	import { getCollectionState, getCollectionView } from '$lib/components/collection/index.js';

	const TABS_OPTIONS = { PROPERTIES: 'PROPERTIES', VIEWS: 'VIEWS' } as const;
	type Tab = (typeof TABS_OPTIONS)[keyof typeof TABS_OPTIONS];

	let { data } = $props();

	const collectionState = getCollectionState();
	const viewState = getViewState();
	const propertyState = getPropertyState();
	const panelState = getContext<ModalState>(COLLECTION_PAGE_PANEL_CTX_KEY);
	const collection = $derived(collectionState.getCollection(data.cid)!);

	let openedPropertyEditor = $state<string | null>(null);
	let openedViewEdit = $state<string | null>(null);
	let isSmHeadingVisible = $state(false);
	let currentTab = $state<Tab>(TABS_OPTIONS.PROPERTIES);

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

	function handleTabChange(value: string) {
		currentTab = value as Tab;
	}
</script>

<svelte:head>
	<title>Collection Structure - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader
		class={tm(!isSmHeadingVisible && data.insidePanel ? 'justify-end' : 'justify-between')}
	>
		{#if data.insidePanel}
			<PageTitle
				small
				icon="structure"
				title="Structure"
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
				<BreadcrumbItem icon="structure" name="Structure" last />
			</Breadcrumb>
			<PageTitle
				small
				icon="structure"
				title="Structure"
				class={isSmHeadingVisible ? 'grow flex lg:hidden' : 'hidden'}
			/>
		{/if}
	</PageHeader>
	<PageContent onscroll={handleScroll}>
		<PageTitle icon="structure" title="Structure" />

		<Tabs value={TABS_OPTIONS.PROPERTIES} onChange={handleTabChange}>
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
	</PageContent>
	<PageFooter>
		{#if currentTab === TABS_OPTIONS.PROPERTIES}
			<AddProperty refresh={data.insidePanel} />
		{:else if currentTab === TABS_OPTIONS.VIEWS}
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
