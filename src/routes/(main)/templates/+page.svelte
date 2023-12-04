<script lang="ts">
	import type { PageData } from './$types';
	import { PageHeader } from '$lib/components';
	import { Dna, Expand, List, Search, Table } from 'lucide-svelte';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import sortFun, { type IBaseSchema, type OrderType } from '$lib/utils/sort';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { PROPERTY_COLORS } from '$lib/constant';
	import * as Dialog from '$lib/components/ui/dialog';

	import type { Template, TemplateItem } from '@prisma/client';
	import { trpc } from '$lib/trpc/client';

	export let data: PageData;
	$: templates = data.templates;

	let isPreviewDialogOpen = false;
	let sheetActiveTemplate: Template | null = null;

	let view = 'list';

	let sortDetail: { field: keyof IBaseSchema; order: OrderType } = { field: 'name', order: 'asc' };

	$: sortedTemplates = templates.sort(sortFun(sortDetail.field, sortDetail.order));

	type SortOption = {
		label: string;
		field: keyof IBaseSchema;
		order: OrderType;
	};

	const sortOptions: SortOption[] = [
		{ label: 'By name (A-Z)', field: 'name', order: 'asc' },
		{ label: 'By name (Z-A)', field: 'name', order: 'desc' },
		{ label: 'By lastest updated', field: 'updatedAt', order: 'asc' },
		{ label: 'By oldest updated', field: 'updatedAt', order: 'desc' },
		{ label: 'By Recently added ', field: 'createdAt', order: 'asc' },
		{ label: 'By oldest added', field: 'createdAt', order: 'desc' }
	];

	$: currSortLabel = sortOptions.find(
		(option) => option.field === sortDetail.field && option.order === sortDetail.order
	)?.label;

	let currActiveTemplateId: string | undefined = undefined;

	const getPropertyValue = (item: TemplateItem, id: string): string => {
		const property = item.properties.find((property) => property.id === id);
		return property ? property.value : '';
	};

	// TODO: ref better try catch and feedback
	const createCollectionBasedOnTemplate = async (id: string) => {
		try {
			const { name, description, properties } = await trpc().templates.load.query(id);

			const createdCollection = await trpc().collections.create.mutate({
				name,
				description,
				properties,
				groupId: null
			});

			console.log(createdCollection);

			// TODO:fill the collection
		} catch (error) {
			console.log(error);
		}
	};
</script>

<div class="grow p-1 rounded-md bg-card text-secondary-foreground">
	<PageHeader>
		<div class="font-semibold text-xl">Templates</div>
	</PageHeader>

	<div class="w-full max-w-7xl mx-auto p-10 space-y-2">
		<div class="flex items-center space-x-2">
			<Dna class="icon-lg" />
			<h1 class="font-semibold text-3xl">Templates</h1>
		</div>
		<p>Page description</p>

		<div>
			<a href="/templates? id = xpto"> hehehfhe </a>
		</div>

		<div class="space-y-2">
			<div class="flex justify-between space-x-2">
				<div class="flex justify-between items-center space-x-0.5">
					<RadioGroup.Root bind:value={view} class="h-9 flex px-0.5 rounded-sm bg-secondary">
						<div class="flex items-center space-x-2">
							<Label
								for="list"
								class={`${
									view === 'list' ? 'bg-card' : 'bg-secondary'
								} py-0.5 px-1.5 rounded-sm text-secondary-foreground`}
							>
								<RadioGroup.Item value="list" id="list" class="sr-only" />

								<div class="flex items-center justify-between space-x-2 text-base">
									<List class="icon-xs" />
									<span> List </span>
								</div>
							</Label>
						</div>

						<div class="flex items-center space-x-2">
							<Label
								for="table"
								class={`${
									view === 'table' ? 'bg-card' : 'bg-secondary hover:bg-card/90'
								} py-0.5 px-1 rounded-sm`}
							>
								<RadioGroup.Item value="table" id="table" class="sr-only" />

								<div class="flex items-center justify-between space-x-2 text-base">
									<Table class="icon-xs" />
									<span> Table </span>
								</div>
							</Label>
						</div>
					</RadioGroup.Root>

					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild let:builder>
							<Button builders={[builder]} variant="secondary" size="sm"
								>Sort {currSortLabel}</Button
							>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-56">
							<DropdownMenu.Label>Sort By</DropdownMenu.Label>
							<DropdownMenu.Separator />

							<DropdownMenu.Group>
								{#each sortOptions as { label, field, order }}
									<DropdownMenu.CheckboxItem
										checked={sortDetail.field === field && sortDetail.order === order}
										on:click={() => (sortDetail = { field, order })}
									>
										{label}
									</DropdownMenu.CheckboxItem>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				<div class="flex justify-between items-center space-x-2">
					<div class="relative">
						<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
							<Search class="text-primary w-5 h-5" />
						</div>
						<input
							class="w-full h-9 pl-10 text-base font-semibold rounded bg-secondary placeholder:text-primary focus:outline-none focus:placeholder:text-gray-800"
							placeholder="Find Template"
						/>
					</div>
				</div>
			</div>

			<div class="space-y-2">
				{#each sortedTemplates as template (template.id)}
					<div
						class={cn(
							'flex flex-col items-start  py-1 px-2 space-y-2 group rounded bg-secondary/40',
							template.id === currActiveTemplateId &&
								'rounded-l-md border-r-2 border-primary bg-secondary/80'
						)}
					>
						<div class="w-full flex justify-between items-center space-x-2">
							<h2 class="grow text-lg font-semibold">{template.name}</h2>

							<Button
								variant="ghost"
								size="xs"
								on:click={() => {
									isPreviewDialogOpen = true;
									sheetActiveTemplate = templates.find((temp) => temp.id === template.id) || null;
								}}
							>
								<Expand class="icon-sm" />
							</Button>
						</div>

						<div class="flex flex-wrap gap-2">
							{#each template.properties as property (property.id)}
								<span
									class={cn(
										'h-6 py-1 px-1.5 flex items-center rounded font-semibold',
										PROPERTY_COLORS['GRAY']
									)}
								>
									{property.name}
								</span>
							{:else}
								<span> No properties</span>
							{/each}
						</div>
						<p>{template.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<Dialog.Root bind:open={isPreviewDialogOpen}>
	<Dialog.Content>
		{#if sheetActiveTemplate}
			<Dialog.Header>
				<Dialog.Title>{sheetActiveTemplate.name} - Template</Dialog.Title>
				<Dialog.Description>
					{sheetActiveTemplate.description}
				</Dialog.Description>
			</Dialog.Header>

			<div class="grow flex flex-col">
				<div class="space-y-2">
					<div>
						<p>Example of item</p>
						<div class="flex flex-col space-y-2">
							{#each sheetActiveTemplate.items as item (item.id)}
								<span class="w-full px-2 flex flex-col border-l-2 border-primary">
									<span class="font-semibold text-lg">
										{item.name}
									</span>

									{#each sheetActiveTemplate.properties as property (property.id)}
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
								{#each sheetActiveTemplate.properties as property (property.id)}
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
				</div>
			</div>

			<Button
				class="w-full"
				on:click={() => {
					if (sheetActiveTemplate) createCollectionBasedOnTemplate(sheetActiveTemplate.id);
				}}>Use this template</Button
			>
		{/if}
	</Dialog.Content>
</Dialog.Root>
