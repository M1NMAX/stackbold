<script lang="ts">
	import type { PageData } from './$types';
	import { Dna } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { invalidateAll } from '$app/navigation';
	import { onError, redirectToast } from '$lib/components/feedback';
	import { trpc } from '$lib/trpc/client';
	import type { TemplateItem } from '@prisma/client';
	import { PageHeader } from '$lib/components/page';

	export let data: PageData;

	function getPropertyValue(item: TemplateItem, id: string) {
		const property = item.properties.find((property) => property.id === id);
		return property ? property.value : '';
	}

	// TODO: ref better try catch and feedback
	async function createCollectionBasedOnTemplate(id: string) {
		try {
			const { name, description, properties, items } = await trpc().templates.load.query(id);

			const createdCollection = await trpc().collections.create.mutate({
				name,
				description,
				properties,
				groupId: null
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
	<title>{data.template.name} - Templates - Stackbold</title>
</svelte:head>

<div class="h-full w-full mx-auto p-2 lg:p-8 space-y-2 overflow-y-auto">
	<PageHeader />

	<div class="flex items-center space-x-2">
		<Dna class="icon-lg" />
		<h1 class="font-semibold text-3xl">{data.template.name}</h1>
	</div>
	<p>{data.template.description}</p>

	<div class="grow flex flex-col">
		<div class="space-y-2">
			<div>
				<p>Example of item</p>
				<div class="flex flex-col space-y-2">
					{#each data.template.items as item (item.id)}
						<span class="w-full px-2 flex flex-col border-l-2 border-primary">
							<span class="font-semibold text-lg">
								{item.name}
							</span>

							{#each data.template.properties as property (property.id)}
								<span class="space-x-1">
									<span>{property.name}</span>
									<span class="px-1 font-light rounded bg-gray-200 dark:bg-gray-700">
										{getPropertyValue(item, property.id)}
									</span>
								</span>
							{/each}
						</span>
					{/each}
				</div>
			</div>

			<div>
				<p>Properties</p>
				<table
					class="w-full border-separate border-spacing-2 border-l-2 border-gray-300 dark:border-gray-600"
				>
					<thead>
						<tr>
							<th class="rounded-tl border-2 border-gray-300 dark:border-gray-600"> Name </th>
							<th class="rounded-tr border-2 border-gray-300 dark:border-gray-600"> Type </th>
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
		</div>
	</div>

	<Button
		class="w-full"
		on:click={() => {
			createCollectionBasedOnTemplate(data.template.id);
		}}
	>
		Use this template
	</Button>
</div>
