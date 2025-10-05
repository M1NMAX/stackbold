<script lang="ts">
	import { Breadcrumb, BreadcrumbItem, Button } from '$lib/components/base/index.js';
	import { getToastState, ModalState } from '$lib/states/index.js';
	import {
		PageContainer,
		PageContent,
		PageFooter,
		PageHeader,
		PageTitle
	} from '$lib/components/page/index.js';
	import { DEFAULT_FEEDBACK_ERR_MESSAGE, TEMPLATE_PANEL_CTX_KEY } from '$lib/constant/index.js';
	import { ChevronLeft, X } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import {
		getPropertyColor,
		getPropertyRef,
		PropertyTemplate
	} from '$lib/components/property/index.js';
	import { trpc } from '$lib/trpc/client';
	import { getCollectionState } from '$lib/components/collection/index.js';
	import { goto } from '$app/navigation';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';
	import { tm } from '$lib/utils/index.js';

	let { data } = $props();
	let template = $derived(data.template);
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

<PageContainer>
	<PageHeader
		class={tm(!isSmHeadingVisible && data.insidePanel ? 'justify-end' : 'justify-between')}
	>
		{#if data.insidePanel}
			<PageTitle
				small
				icon={template.icon}
				title={template.name}
				class={tm(isSmHeadingVisible ? 'flex-1' : 'hidden')}
			/>
			<Button theme="secondary" variant="icon" onclick={() => goBack()}>
				<X />
			</Button>
		{:else}
			<SidebarOpenBtn />
			<Button theme="secondary" variant="icon" class="lg:hidden" onclick={() => history.back()}>
				<ChevronLeft />
			</Button>
			<Breadcrumb class="hidden lg:flex">
				<BreadcrumbItem icon="templates" name="Templates" link="/templates" />
				<BreadcrumbItem icon={template.icon} name={template.name} last />
			</Breadcrumb>
			<PageTitle
				icon={template.icon}
				title={template.name}
				class={isSmHeadingVisible ? 'flex lg:hidden' : 'hidden'}
				small
			/>
		{/if}
	</PageHeader>
	<PageContent class={tm(data.insidePanel && 'lg:pt-2')} onscroll={handleScroll}>
		<PageTitle icon={template.icon} title={template.name} />
		<p>
			{template.description}
		</p>
		<div class="grow flex flex-col space-y-2">
			<div class="space-y-2">
				<h3 class="text-lg font-semibold">Items</h3>

				<div class="flex flex-col space-y-2">
					{#each template.items as item (item.id)}
						<div class="w-full flex flex-col space-y-2 p-2 rounded-sm bg-secondary/40">
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
	</PageContent>

	<PageFooter>
		<Button class="w-full" onclick={() => createCollectionBasedOnTemplate()}>
			Use this template
		</Button>
	</PageFooter>
</PageContainer>
