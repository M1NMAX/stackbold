<script lang="ts">
	import { Button } from '$lib/components/base/index.js';
	import { getToastState, ModalState } from '$lib/states/index.js';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import {
		COLLECTION_ICONS,
		DEFAULT_FEEDBACK_ERR_MESSAGE,
		TEMPLATE_PANEL_CTX_KEY
	} from '$lib/constant/index.js';
	import { ChevronLeft, X } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import { getPropertyColor, getPropertyRef, PropertyTemplate } from '$lib/components/property';
	import { trpc } from '$lib/trpc/client';
	import { getCollectionState } from '$lib/components/collection/index.js';
	import { goto } from '$app/navigation';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';

	let { data } = $props();
	let template = $derived(data.template);
	const Icon = $derived(COLLECTION_ICONS[template.icon]);
	let isSmHeadingVisible = $state(false);

	const toastState = getToastState();
	const templatePanel = getContext<ModalState>(TEMPLATE_PANEL_CTX_KEY);
	const collectionState = getCollectionState();

	function goBack() {
		history.back();
		templatePanel.close();
	}

	// TODO: ref better try catch and feedback
	async function createCollectionBasedOnTemplate() {
		try {
			const collection = await trpc().templates.turn.mutate(template.id);

			await collectionState.refresh();

			toastState.action({
				message: 'New collection created',
				action: {
					label: 'Go',
					onclick: () => goto(`/collections/${collection.id}`)
				}
			});
		} catch (error) {
			console.log(error);
			toastState.error(DEFAULT_FEEDBACK_ERR_MESSAGE);
		}
	}

	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}
</script>

<svelte:head>
	<title>Template - Stackbold</title>
</svelte:head>

{#if data.insidePanel}
	<div class="flex items-center justify-between space-x-1">
		<div class="flex items-center space-x-2">
			<Icon class="size-6" />
			<h1 class="grow text-xl font-semibold">
				{template.name}
			</h1>
		</div>

		<Button theme="secondary" variant="icon" onclick={() => goBack()}>
			<X />
		</Button>
	</div>

	<div class="grow flex flex-col overflow-y-auto hd-scroll" onscroll={handleScroll}>
		{@render templateData()}
	</div>

	{@render useTemplateBtn()}
{:else}
	<PageContainer>
		<PageHeader>
			<SidebarOpenBtn />
			<Button theme="secondary" variant="icon" class="lg:hidden" onclick={() => history.back()}>
				<ChevronLeft />
			</Button>
			{#if isSmHeadingVisible}
				<div class="grow flex items-center space-x-2">
					<Icon clas="size-5" />
					<h1 class="text-lg font-semibold">
						{template.name}
					</h1>
				</div>
			{/if}
		</PageHeader>
		<PageContent class="grow" onscroll={handleScroll}>
			<div class="flex items-center space-x-2 pt-1">
				<Icon class="size-6" />
				<h2 class="text-2xl font-semibold">
					{template.name}
				</h2>
			</div>
			{@render templateData()}
		</PageContent>

		<div class="p-2">
			{@render useTemplateBtn()}
		</div>
	</PageContainer>
{/if}

{#snippet templateData()}
	<p>
		{template.description}
	</p>
	<div class="grow flex flex-col space-y-2">
		<div class="space-y-2">
			<h3 class="text-lg font-semibold">Items</h3>

			<div class="flex flex-col space-y-2">
				{#each template.items as item (item.id)}
					<div
						class="w-full flex flex-col py-1 px-2 space-y-2 rounded-sm bg-secondary/40 hover:bg-secondary/50"
					>
						<div class="font-semibold text-lg">
							{item.name}
						</div>

						<div class="flex flex-wrap gap-2">
							{#each template.properties as property (property.id)}
								{@const propertyRef = getPropertyRef(item.properties, property.id)}
								{#if propertyRef && propertyRef.value !== ''}
									{@const color = getPropertyColor(property, propertyRef.value)}

									<PropertyTemplate {property} {color} value={propertyRef.value} />
								{/if}
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/snippet}

{#snippet useTemplateBtn()}
	<div class="grid justify-items-start">
		<Button class="w-full" onclick={() => createCollectionBasedOnTemplate()}>
			Use this template
		</Button>
	</div>
{/snippet}
