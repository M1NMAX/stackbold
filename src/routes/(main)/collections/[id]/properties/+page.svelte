<script lang="ts">
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import X from 'lucide-svelte/icons/x';
	import { ModalState } from '$lib/states/index.js';
	import {
		PageContainer,
		PageContent,
		PageFooter,
		PageHeader
	} from '$lib/components/page/index.js';
	import { AddProperty, getPropertyState, PropertyEditor } from '$lib/components/property/index.js';
	import { Button } from '$lib/components/base/index.js';
	import { COLLECTION_PAGE_PANEL_CTX_KEY } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/index.js';
	import { getContext } from 'svelte';

	let { data } = $props();

	const propertyState = getPropertyState();
	const panelState = getContext<ModalState>(COLLECTION_PAGE_PANEL_CTX_KEY);

	let currentlyOpen = $state<string | null>(null);
	let isSmHeadingVisible = $state(false);

	function toggleEditor(pid: string | null) {
		currentlyOpen = pid;
	}

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
	<title>Properties - Stackbold</title>
</svelte:head>

{#if data.insidePanel}
	<div
		class={tm(
			'flex items-center justify-between space-x-1 p-4 pb-2',
			!isSmHeadingVisible && 'justify-end'
		)}
	>
		<h1 class={tm('grow text-xl font-semibold', isSmHeadingVisible ? 'visible' : 'hidden')}>
			Properties
		</h1>
		<Button theme="secondary" variant="icon" onclick={() => goBack()}>
			<X />
		</Button>
	</div>

	<div class="grow flex flex-col space-y-2 hd-scroll" onscroll={handleScroll}>
		<h1 class={tm('text-2xl font-semibold px-4 ', !isSmHeadingVisible ? 'visible' : 'hidden')}>
			Properties
		</h1>
		<div class="space-y-2">
			{@render editors()}
		</div>
	</div>

	<div class="px-4 pb-4">
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
		<PageContent class="grow px-0 gap-y-0 hd-scroll" onscroll={handleScroll}>
			<h1 class={tm('pb-2 px-4 font-semibold text-xl', !isSmHeadingVisible ? 'visible' : 'hidden')}>
				Properties
			</h1>

			{@render editors()}
		</PageContent>
		<PageFooter>
			<AddProperty />
		</PageFooter>
	</PageContainer>
{/if}

{#snippet editors()}
	{#each propertyState.properties as property (property.id)}
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
