<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { invalidateAll } from '$app/navigation';
	import { onError, redirectToast } from '$lib/components/feedback';
	import { trpc } from '$lib/trpc/client';
	import { PageHeader } from '$lib/components/page';
	import { icons } from '$lib/components/icon';
	import { cn } from '$lib/utils';
	import { PROPERTY_COLORS } from '$lib/constant';
	import { getPropertyColor, getPropertyRef, getPropertyValue } from '$lib/components/property';

	export let data: PageData;
	$: ({ template } = data);

	// TODO: ref better try catch and feedback
	async function createCollectionBasedOnTemplate(id: string) {
		try {
			const { icon, name, description, properties, items } = await trpc().templates.load.query(id);

			const createdCollection = await trpc().collections.create.mutate({
				icon,
				name,
				description,
				properties
			});

			const itemsCopy = items.map(({ id, ...rest }) => ({
				...rest,
				collectionId: createdCollection.id
			}));

			await trpc().items.createMany.mutate(itemsCopy);

			redirectToast('New collection created', `/collections/${createdCollection.id}`);
			await invalidateAll();
		} catch (error) {
			onError(error);
		}
	}
</script>

<svelte:head>
	<title>{template.name} - Templates - Stackbold</title>
</svelte:head>

<div class="h-full w-full mx-auto p-2 lg:p-8 space-y-2 overflow-y-auto">
	<PageHeader />

	<div class="flex items-center space-x-2">
		<svelte:component this={icons[template.icon]} class="icon icon-lg" />
		<h1 class="font-semibold text-3xl">{template.name}</h1>
	</div>
	<p>{template.description}</p>

	<div class="grow flex flex-col">
		<div class="space-y-2">
			<div>
				<h2>Properties</h2>
				<table class="w-full border-2 border-gray-300 dark:border-gray-600">
					<thead>
						<tr>
							<th class=" border-gray-300 dark:border-gray-600"> Name </th>
							<th class="border-2 border-gray-300 dark:border-gray-600"> Type </th>
						</tr>
					</thead>
					<tbody>
						{#each data.template.properties as property (property.id)}
							<tr>
								<td class="border-2 border-gray-300 dark:border-gray-600">
									{property.name}
								</td>
								<td class="border-2 border-gray-300 dark:border-gray-600 first-letter:uppercase">
									{property.type.toLowerCase()}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div>
				<h2>Example of item</h2>
				<div class="flex flex-col space-y-2">
					{#each template.items as item (item.id)}
						<div
							class="w-full flex flex-col py-1 px-2 space-y-2 rounded-sm bg-secondary/40 hover:bg-secondary/50"
						>
							<div class="font-semibold text-lg">
								{item.name}
							</div>

							<!-- TODO: take property type in consideration and show values accordin  -->
							<div class="flex flex-wrap gap-2">
								{#each template.properties as property (property.id)}
									{@const propertyRef = getPropertyRef(item.properties, property.id)}
									{#if propertyRef}
										{@const color = getPropertyColor(property, propertyRef.value)}
										<span
											class={cn(
												'h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold',
												PROPERTY_COLORS[color]
											)}
										>
											{getPropertyValue(property, propertyRef.value)}
										</span>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<Button class="w-full" on:click={() => createCollectionBasedOnTemplate(template.id)}>
		Use this template
	</Button>
</div>
