<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { getToastState, ModalState } from '$lib/states/index.js';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { DEFAULT_FEEDBACK_ERR_MESSAGE, TEMPLATE_PANEL_CTX_KEY } from '$lib/constant';
	import { ChevronLeft, X } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import { icons } from '$lib/components/icon';
	import { getPropertyColor, getPropertyRef, PropertyTemplate } from '$lib/components/property';
	import { trpc } from '$lib/trpc/client';
	import { getCollectionState } from '$lib/components/collection/collectionState.svelte.js';
	import { goto } from '$app/navigation';

	let { data } = $props();
	let template = $derived(data.template);
	const Icon = $derived(icons[template.icon]);
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
			const { icon, name, description, properties, groupByConfigs, items } = template;

			const createdCollection = await trpc().collections.create.mutate({
				icon,
				name,
				description,
				properties,
				groupByConfigs
			});

			const itemsCopy = items.map(({ id, ...rest }) => ({
				...rest,
				collectionId: createdCollection.id
			}));

			await trpc().items.createMany.mutate(itemsCopy);

			await collectionState.refresh();

			toastState.addActionToast({
				message: 'New collection created',
				action: {
					label: 'Go',
					onclick: () => goto(`/collections/${createdCollection.id}`)
				}
			});
		} catch (error) {
			console.log(error);
			toastState.addErrorToast(DEFAULT_FEEDBACK_ERR_MESSAGE);
		}
	}

	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}
</script>

{#if data.insidePanel}
	<div class="flex items-center justify-between space-x-1">
		<div class="flex items-center space-x-2">
			<Icon class="icon-md" />
			<h1 class="grow text-xl font-semibold">
				{template.name}
			</h1>
		</div>

		<Button variant="secondary" size="icon" onclick={() => goBack()}>
			<X class="icon-sm" />
		</Button>
	</div>

	<div class="grow flex flex-col overflow-y-auto hd-scroll" onscroll={handleScroll}>
		{@render templateData()}
	</div>

	{@render useTemplateBtn()}
{:else}
	<PageContainer>
		<PageHeader>
			<Button variant="secondary" size="icon" onclick={() => history.back()}>
				<ChevronLeft />
			</Button>
			{#if isSmHeadingVisible}
				<div class="flex items-center space-x-2">
					<Icon clas="icon-sm" />
					<h1 class="text-lg font-semibold">
						{template.name}
					</h1>
				</div>
			{/if}
		</PageHeader>
		<PageContent class="grow" onScroll={handleScroll}>
			<div class="flex items-center space-x-2 pt-1">
				<Icon class="icon-md" />
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
