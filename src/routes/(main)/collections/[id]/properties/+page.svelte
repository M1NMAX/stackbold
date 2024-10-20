<script lang="ts">
	import { ModalState } from '$lib/components/modal';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { AddPropertyPopover, getPropertyState, PropertyEditor } from '$lib/components/property';
	import { Button } from '$lib/components/ui/button';
	import { PROPERTIES_PANEL_CTX_KEY } from '$lib/constant';
	import { cn } from '$lib/utils/index.js';
	import { ArrowDown, ChevronLeft, X } from 'lucide-svelte';
	import { getContext } from 'svelte';

	let { data } = $props();

	const propertyState = getPropertyState();

	const propertiesPanel = getContext<ModalState>(PROPERTIES_PANEL_CTX_KEY);

	let currentlyOpen = $state<string | null>(
		propertyState.properties.length > 0 ? propertyState.properties[0].id : null
	);
	function toggleEditor(pid: string | null) {
		currentlyOpen = pid;
	}

	function onClickCloseBtn() {
		history.back();
		propertiesPanel.close();
	}

	let isSmHeadingVisible = $state(false);
	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}
</script>

{#if data.insidePanel}
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-semibold text-center">Properties</h2>
		<Button variant="secondary" size="icon" on:click={() => onClickCloseBtn()}>
			<X class="icon-sm" />
		</Button>
	</div>

	<div class="grow flex flex-col space-y-2 overflow-y-auto hd-scroll">
		{@render editors()}
	</div>

	<div>
		<AddPropertyPopover />
	</div>
{:else}
	<PageContainer>
		<PageHeader>
			<Button variant="secondary" size="icon" on:click={() => history.back()}>
				<ChevronLeft />
			</Button>

			<h1 class={cn('font-semibold text-xl', isSmHeadingVisible ? 'visible' : 'hidden')}>
				Properties
			</h1>
		</PageHeader>
		<PageContent class="grow" onScroll={handleScroll}>
			<h1 class={cn('pb-2 font-semibold text-xl', !isSmHeadingVisible ? 'visible' : 'hidden')}>
				Properties
			</h1>

			{@render editors()}
		</PageContent>
		<div class="px-2 pb-2">
			<AddPropertyPopover />
		</div>
	</PageContainer>
{/if}

{#snippet editors()}
	{#each propertyState.properties as property}
		<PropertyEditor
			{property}
			isOpen={currentlyOpen === property.id}
			openChange={(value) => toggleEditor(value)}
		/>
	{:else}
		<div class="h-full flex flex-col items-center justify-center space-y-2">
			<p class="text-center text-lg">This collection has no properties. <br /> Please add one</p>

			<ArrowDown class=" icon-lg" />
		</div>
	{/each}
{/snippet}
