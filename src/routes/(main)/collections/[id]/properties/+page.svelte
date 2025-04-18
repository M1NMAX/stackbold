<script lang="ts">
	import { ModalState } from '$lib/states/index.js';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { AddProperty, getPropertyState, PropertyEditor } from '$lib/components/property';
	import { Button } from '$lib/components/base/index.js';
	import { PROPERTIES_PANEL_CTX_KEY } from '$lib/constant';
	import { tm } from '$lib/utils/index.js';
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

	function goBack() {
		history.back();
		if (data.insidePanel) {
			propertiesPanel.close();
		}
	}

	let isSmHeadingVisible = $state(false);
	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}
</script>

<svelte:head>
	<title>Properties - Stackbold</title>
</svelte:head>

{#if data.insidePanel}
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-semibold text-center">Properties</h2>
		<Button theme="secondary" variant="icon" onclick={() => goBack()}>
			<X />
		</Button>
	</div>

	<div class="grow flex flex-col space-y-2 overflow-y-auto hd-scroll">
		{@render editors()}
	</div>

	<div>
		<AddProperty />
	</div>
{:else}
	<PageContainer>
		<PageHeader>
			<Button theme="secondary" variant="icon" onclick={() => goBack()}>
				<ChevronLeft />
			</Button>

			<h1 class={tm('font-semibold text-xl', isSmHeadingVisible ? 'visible' : 'hidden')}>
				Properties
			</h1>
		</PageHeader>
		<PageContent class="grow gap-y-0" onScroll={handleScroll}>
			<h1 class={tm('pb-2 font-semibold text-xl', !isSmHeadingVisible ? 'visible' : 'hidden')}>
				Properties
			</h1>

			{@render editors()}
		</PageContent>
		<div class="px-2 pb-2">
			<AddProperty />
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
			<ArrowDown class="size-9" />
		</div>
	{/each}
{/snippet}
