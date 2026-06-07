<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { Breadcrumb, BreadcrumbItem, Button } from '$lib/components/base/index.js';
	import { getToastState, ModalState } from '$lib/states/index.js';
	import { PageContainer, PageFooter } from '$lib/components/page/index.js';
	import { TEMPLATE_PANEL_CTX_KEY } from '$lib/constant/index.js';
	import { getContext } from 'svelte';
	import { PropertyTemplate } from '$lib/components/property/index.js';
	import { trpc } from '$lib/trpc/client';
	import { getCollectionState } from '$lib/components/collection/index.js';
	import { goto } from '$app/navigation';
	import { getPropertyColor, getPropertyRef, getTRPCErrorMsg } from '$lib/utils/index.js';

	let { data } = $props();
	let template = $derived(data.template);

	const toastState = getToastState();
	const templatePanel = getContext<ModalState>(TEMPLATE_PANEL_CTX_KEY);
	const collectionState = getCollectionState();

	function goBack() {
		history.back();
		templatePanel.close();
	}

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
			toastState.error(getTRPCErrorMsg(error));
		}
	}
</script>

<PageContainer icon={template.icon} title={template.name} sidebar={!data.insidePanel}>
	{#snippet topActions()}
		{#if data.insidePanel}
			<Button theme="secondary" variant="icon" onclick={() => goBack()}>
				<X />
			</Button>
		{/if}
	{/snippet}

	{#snippet breadcrumbs()}
		{#if !data.insidePanel}
			<Breadcrumb class="hidden lg:flex lg:grow">
				<BreadcrumbItem icon="templates" name="Templates" link="/templates" />
				<BreadcrumbItem icon={template.icon} name={template.name} last />
			</Breadcrumb>
		{/if}
	{/snippet}
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
	{#snippet footer()}
		<PageFooter>
			<Button class="w-full" onclick={() => createCollectionBasedOnTemplate()}>
				Use this template
			</Button>
		</PageFooter>
	{/snippet}
</PageContainer>
