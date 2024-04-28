<script lang="ts">
	import type { PageData } from './$types';
	import type { Template } from '@prisma/client';
	import { onDestroy } from 'svelte';
	import { ArrowLeft, ArrowUpDown, CheckSquare2, Dna, Square, X } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import { SearchInput, createSearchStore, searchHandler } from '$lib/components/search';
	import { SortDropdown, setSortState } from '$lib/components/sort';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { icons } from '$lib/components/icon';
	import { DEFAULT_SORT_OPTIONS, PROPERTY_COLORS } from '$lib/constant';
	import { getScreenState } from '$lib/components/view';
	import { cn, pluralize } from '$lib/utils';
	import { getPropertyColor, getPropertyRef, getPropertyValue } from '$lib/components/property';
	import { Button } from '$lib/components/ui/button';
	import { ItemDrawer } from '$lib/components/sheet';
	import { trpc } from '$lib/trpc/client';
	import { onError, redirectToast } from '$lib/components/ui/sonner';
	import dayjs from '$lib/utils/dayjs';
	import { tooltipAction } from 'svelte-legos';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';

	export let data: PageData;

	let activeTemplate: Template | null = null;

	let isSheetOpen = false;

	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<Template>[])];

	const sort = setSortState(sortOptions[0]);

	const isDesktop = getScreenState();

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

	function onClickTemplate(id: string) {
		activeTemplate = data.templates.find((template) => template.id === id) || null;
		openSheet();
	}

	function closeSheet() {
		isSheetOpen = false;
	}

	function openSheet() {
		isSheetOpen = true;
	}

	// SEARCH
	const searchTemplates = data.templates.map((template) => ({
		...template,
		searchTerms: `${template.name} ${template.description}`
	}));

	const searchStore = createSearchStore(searchTemplates);

	const unsubscribe = searchStore.subscribe((model) => searchHandler(model));

	onDestroy(() => {
		unsubscribe();
	});

	$: $sort, ($searchStore.filtered = $searchStore.data.sort(sortFun($sort.field, $sort.order)));
</script>

<svelte:head><title>Templates - Stackbold</title></svelte:head>

<PageContainer
	class={cn('flex flex-col space-y-1 ease-in-out duration-300', isSheetOpen && 'w-3/5')}
>
	<PageHeader />
	<PageContent>
		<div class="flex items-center space-x-2">
			<Dna class="icon-lg" />
			<h1 class="font-semibold text-3xl">Templates</h1>
		</div>

		<div class=" space-y-2">
			{#if $isDesktop}
				<div class="w-full flex justify-between space-x-2">
					<SearchInput placeholder="Find Template" bind:value={$searchStore.search} />
					<SortDropdown {sortOptions} bind:currentSort={$sort} />
				</div>
			{:else}
				<div class="flex space-x-1">
					<SearchInput placeholder="Find Collection" bind:value={$searchStore.search} />
					<Drawer.Root>
						<Drawer.Trigger asChild let:builder>
							<Button builders={[builder]} variant="secondary">
								<ArrowUpDown class="icon-sm" />
							</Button>
						</Drawer.Trigger>
						<Drawer.Content>
							<Drawer.Header class="py-1">
								<div class="flex items-center space-x-2">
									<div class="p-2.5 rounded bg-secondary">
										<ArrowUpDown class="icon-sm" />
									</div>
									<div class="text-base font-semibold">Sort By</div>
								</div>
							</Drawer.Header>
							<Drawer.Footer>
								<RadioGroup.Root
									id="sort"
									value={$sort.field + '-' + $sort.order}
									class="px-2 py-1 rounded-md bg-secondary"
								>
									{#each sortOptions as sortOpt}
										<Label class="flex items-center justify-between space-x-2">
											<span class="font-semibold text-lg"> {sortOpt.label} </span>
											<RadioGroup.Item
												value={sortOpt.field + '-' + sortOpt.order}
												id={sortOpt.label}
												on:click={() => {
													$sort = { ...sortOpt };
												}}
											/>
										</Label>
									{/each}
								</RadioGroup.Root></Drawer.Footer
							>
						</Drawer.Content>
					</Drawer.Root>
				</div>
			{/if}

			<div class="space-y-2">
				{#each $searchStore.filtered as template (template.id)}
					<button
						on:click={() => onClickTemplate(template.id)}
						class={cn(
							'w-full flex flex-col items-start py-1 px-2 space-y-2 rounded bg-secondary/40 hover:bg-secondary/60 truncate',
							activeTemplate &&
								activeTemplate.id === template.id &&
								'rounded-r-none border-r-2 border-primary bg-secondary/80'
						)}
					>
						<div class="w-full flex items-center space-x-2">
							<svelte:component this={icons[template.icon]} class=" icon-sm" />
							<span class="text-lg font-semibold">{template.name}</span>
						</div>

						<div class="truncate whitespace-nowrap">{template.description}</div>
					</button>
				{:else}
					<div class="h-[80px] w-full flex items-center justify-center rounded bg-secondary/40">
						<p class=" font-semibold text-xl">Template not found</p>
					</div>
				{/each}
			</div>
		</div>
	</PageContent>
</PageContainer>

<ItemDrawer
	bind:open={isSheetOpen}
	id="activeTemplateDrawer"
	class="w-full lg:w-2/5 p-0 lg:p-1 lg:pl-0"
>
	{#if activeTemplate}
		<div class="h-full flex flex-col space-y-1.5 p-1 rounded-md bg-card">
			<div class="flex justify-between items-center">
				<Button variant="secondary" size="icon" on:click={() => closeSheet()}>
					{#if $isDesktop}
						<X />
					{:else}
						<ArrowLeft />
					{/if}
				</Button>

				<span class="font-semibold text-xs text-gray-500 pr-2">
					Updated
					{dayjs(activeTemplate.updatedAt).fromNow()}
				</span>
			</div>

			<div class="grow flex flex-col space-y-4 overflow-y-auto">
				<h2 class="pt-1 text-2xl font-semibold">
					{activeTemplate.name}
				</h2>
				<p>
					{activeTemplate.description}
				</p>
				<div class="grow flex flex-col space-y-2">
					<div>
						<h3 class="font-semibold">Properties</h3>
						<table class="w-full border-2 border-gray-300 dark:border-gray-600">
							<thead>
								<tr>
									<th class=" border-gray-300 dark:border-gray-600"> Name </th>
									<th class="border-2 border-gray-300 dark:border-gray-600"> Type </th>
								</tr>
							</thead>
							<tbody>
								{#each activeTemplate.properties as property (property.id)}
									<tr>
										<td class="border-2 border-gray-300 dark:border-gray-600">
											{property.name}
										</td>
										<td
											class="border-2 border-gray-300 dark:border-gray-600 first-letter:uppercase"
										>
											{property.type.toLowerCase()}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<div>
						<h3 class="font-semibold">Examples of items</h3>
						<div class="flex flex-col space-y-2">
							{#each activeTemplate.items as item (item.id)}
								<div
									class="w-full flex flex-col py-1 px-2 space-y-2 rounded-sm bg-secondary/40 hover:bg-secondary/50"
								>
									<div class="font-semibold text-lg">
										{item.name}
									</div>

									<div class="flex flex-wrap gap-2">
										{#each activeTemplate.properties as property (property.id)}
											{@const propertyRef = getPropertyRef(item.properties, property.id)}
											{#if propertyRef && propertyRef.value !== ''}
												{@const color = getPropertyColor(property, propertyRef.value)}

												{#if property.type === 'CHECKBOX'}
													<div
														class={cn(
															'h-6 flex items-center space-x-1 py-1 px-1.5 rounded-sm font-semibold',
															PROPERTY_COLORS[color]
														)}
													>
														{#if propertyRef.value === 'true'}
															<CheckSquare2 class="icon-xs" />
														{:else}
															<Square class="icon-xs" />
														{/if}

														<span class="font-semibold">{property.name} </span>
													</div>
												{:else}
													<span
														use:tooltipAction={property.name}
														class={cn(
															'h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold',
															PROPERTY_COLORS[color]
														)}
													>
														{getPropertyValue(property, propertyRef.value)}
													</span>
												{/if}
											{/if}
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div class="grid justify-items-start">
				<Button
					class="w-full"
					on:click={() => {
						if (!activeTemplate) return;

						createCollectionBasedOnTemplate(activeTemplate.id);
					}}
				>
					Use this template
				</Button>
			</div>
		</div>
	{/if}
</ItemDrawer>
