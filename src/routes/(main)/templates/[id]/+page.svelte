<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ModalState } from '$lib/components/modal';
	import { PageContainer, PageContent } from '$lib/components/page';
	import { TEMPLATE_PANEL_CTX_KEY } from '$lib/constant';
	import { ChevronLeft, X } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import { icons } from '$lib/components/icon';
	import { getPropertyColor, getPropertyRef, PropertyTemplate } from '$lib/components/property';
	import { trpc } from '$lib/trpc/client';
	import { onError, redirectToast } from '$lib/components/ui/sonner';
	import { invalidateAll } from '$app/navigation';
	import { cn } from '$lib/utils';

	let { data } = $props();
	let template = $derived(data.template);
	const Icon = $derived(icons[template.icon]);
	let isSmHeadingVisible = $state(false);

	const templatePanel = getContext<ModalState>(TEMPLATE_PANEL_CTX_KEY);
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

			await invalidateAll();
			redirectToast('New collection created', `/collections/${createdCollection.id}`);
		} catch (error) {
			onError(error);
		}
	}

	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}
</script>

{#if data.insidePanel}
	<div
		class={cn('flex items-center justify-between space-x-1', !isSmHeadingVisible && 'justify-end')}
	>
		<h2 class={cn('grow text-xl font-semibold', isSmHeadingVisible ? 'visible' : 'hidden')}>
			{template.name}
		</h2>

		<Button variant="secondary" size="icon" on:click={() => goBack()}>
			<X class="icon-sm" />
		</Button>
	</div>

	{@render templateData()}

	{@render useTemplateBtn()}
{:else}
	<PageContainer>
		<PageContent class="flex flex-col pb-1 px-0 overflow-hidden">
			<div class="flex justify-between items-center space-x-2">
				<Button variant="secondary" size="icon" on:click={() => history.back()}>
					<ChevronLeft />
				</Button>
				<h1 class={cn('grow font-semibold text-xl', isSmHeadingVisible ? 'visible' : 'hidden')}>
					{template.name}
				</h1>
			</div>

			{@render templateData()}

			{@render useTemplateBtn()}
		</PageContent>
	</PageContainer>
{/if}

{#snippet templateData()}
	<div class="grow flex flex-col space-y-4 overflow-y-auto" onscroll={handleScroll}>
		<div class="flex items-center space-x-2 pt-1">
			<Icon class="icon-md" />
			<h2 class="text-2xl font-semibold">
				{template.name}
			</h2>
		</div>
		<p>
			{template.description}
		</p>
		<div class="grow flex flex-col space-y-2">
			<div>
				<h3 class="text-xl font-semibold">Items</h3>

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
	</div>
{/snippet}

{#snippet useTemplateBtn()}
	<div class="grid justify-items-start">
		<Button class="w-full" on:click={() => createCollectionBasedOnTemplate()}>
			Use this template
		</Button>
	</div>
{/snippet}
