<script lang="ts">
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import X from 'lucide-svelte/icons/x';
	import { ModalState } from '$lib/states/index.js';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page/index.js';
	import { AddProperty, getPropertyState, PropertyEditor } from '$lib/components/property/index.js';
	import { Button, TabContent, Tabs, TabTrigger } from '$lib/components/base/index.js';
	import { COLLECTION_PAGE_PANEL_CTX_KEY } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/index.js';
	import { getContext } from 'svelte';
	import { AddView, getViewState, ViewEditor } from '$lib/components/view/index.js';

	let { data } = $props();

	const viewState = getViewState();
	const propertyState = getPropertyState();
	const panelState = getContext<ModalState>(COLLECTION_PAGE_PANEL_CTX_KEY);

	let openedPropertyEditor = $state<string | null>(null);
	let openedViewEdit = $state<string | null>(null);
	let isSmHeadingVisible = $state(false);

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
</script>

<svelte:head>
	<title>Collection Settings - Stackbold</title>
</svelte:head>

{#if data.insidePanel}
	<div
		class={tm(
			'flex items-center justify-between space-x-1 p-4 pb-2',
			!isSmHeadingVisible && 'justify-end'
		)}
	>
		<h1 class={tm('grow text-xl font-semibold')}>Settings</h1>
		<Button theme="secondary" variant="icon" onclick={() => goBack()}>
			<X />
		</Button>
	</div>

	{@render content()}
{:else}
	<PageContainer>
		<PageHeader>
			<Button theme="secondary" variant="icon" onclick={() => goBack()}>
				<ChevronLeft />
			</Button>

			<h1 class={tm('font-semibold text-xl', isSmHeadingVisible ? 'visible' : 'hidden')}>
				Settings
			</h1>
		</PageHeader>
		<PageContent class="grow px-0 gap-y-0 hd-scroll" onscroll={handleScroll}>
			<h1 class={tm('pb-2 px-4 font-semibold text-xl', !isSmHeadingVisible ? 'visible' : 'hidden')}>
				Settings
			</h1>

			{@render content()}
		</PageContent>
	</PageContainer>
{/if}

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

{#snippet content()}
	<Tabs value="properties" class="h-full">
		{#snippet triggers()}
			<div class="w-full flex rounded-md bg-secondary/50">
				<TabTrigger value="properties">Properties</TabTrigger>
				<TabTrigger value="views">Views</TabTrigger>
			</div>
		{/snippet}
		<TabContent value="properties" class="grow flex flex-col justify-between overflow-y-hidden">
			{@render propertiesEditors()}
			<div class="p-4">
				<AddProperty refresh={data.insidePanel} />
			</div>
		</TabContent>

		<TabContent value="views" class="grow flex flex-col justify-between overflow-y-hidden">
			{@render viewsEditors()}
			<div class="p-4">
				<AddView />
			</div>
		</TabContent>
	</Tabs>
{/snippet}
