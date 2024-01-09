<script lang="ts">
	import type { PageData } from './$types';
	import { Dna } from 'lucide-svelte';
	import { Root as DialogRoot, Content as DialogContent } from '$lib/components/ui/dialog';
	import { goto, preloadData, pushState } from '$app/navigation';
	import { SearchInput } from '$lib/components/search';
	import debounce from 'debounce';
	import { SortDropdown, setSortState } from '$lib/components/sort';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import TemplatePage from './[id]/+page.svelte';
	import { page } from '$app/stores';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { icons } from '$lib/components/icon';
	import type { Template } from '@prisma/client';

	export let data: PageData;
	$: ({ templates } = data);

	let isPreviewDialogOpen = false;

	const sortOptions: SortOption<Template>[] = [
		{ label: 'By name (A-Z)', field: 'name', order: 'asc' },
		{ label: 'By name (Z-A)', field: 'name', order: 'desc' },
		{ label: 'By lastest updated', field: 'updatedAt', order: 'asc' },
		{ label: 'By oldest updated', field: 'updatedAt', order: 'desc' },
		{ label: 'By Recently added ', field: 'createdAt', order: 'asc' },
		{ label: 'By oldest added', field: 'createdAt', order: 'desc' }
	];

	const sort = setSortState(sortOptions[0]);

	// SEARCH

	const DEBOUNCE_INTERVAL = 500;
	const debounceSearch = debounce((query: string) => {
		sortedTemplates = sortedTemplates.filter(({ name, description }) => {
			return name.toLowerCase().includes(query) || description.toLowerCase().includes(query);
		});
	}, DEBOUNCE_INTERVAL);

	function handleOnInputSearch(e: Event) {
		const value = (e.target as HTMLInputElement).value;

		if (value.length > 2) debounceSearch(value);
		else sortedTemplates = templates.sort(sortFun($sort.field, $sort.order));
	}

	async function onTemplateLinkClick(e: MouseEvent & { currentTarget: HTMLAnchorElement }) {
		// bail if opening a new tab, or we're on too small a screen
		if (e.metaKey || e.ctrlKey || innerWidth < 640) return;
		e.preventDefault();

		const { href } = e.currentTarget;

		const result = await preloadData(href);

		if (result.load === 'loaded' || result.status === 200) {
			result.data.isModal = true;

			pushState(href, { template: result.data });
		} else {
			goto(href);
		}
	}

	$: sortedTemplates = templates.sort(sortFun($sort.field, $sort.order));

	$: if ($page.state.template) {
		isPreviewDialogOpen = true;
	} else {
		isPreviewDialogOpen = false;
	}

	function noCheck(x: any) {
		return x;
	}
</script>

<svelte:head><title>Templates - Stackbold</title></svelte:head>

<PageContainer>
	<PageHeader />
	<PageContent>
		<div class="flex items-center space-x-2">
			<Dna class="icon-lg" />
			<h1 class="font-semibold text-3xl">Templates</h1>
		</div>
		<!-- TODO: write the page description -->
		<p>Page description</p>

		<div class=" space-y-2">
			<div class="flex justify-between space-x-2">
				<div class="w-1/3 flex justify-between items-center space-x-2">
					<SearchInput placeholder="Find Template" on:input={handleOnInputSearch} />
				</div>
				<div class="flex justify-between items-center space-x-2">
					<SortDropdown {sortOptions} bind:currentSort={$sort} />
				</div>
			</div>

			<div class="space-y-2">
				{#each sortedTemplates as template (template.id)}
					<a
						href="/templates/{template.id}"
						on:click={onTemplateLinkClick}
						class="flex flex-col items-start py-1 px-2 space-y-2 rounded bg-secondary/40 hover:bg-secondary/60"
					>
						<div class="w-full flex justify-between items-center space-x-2">
							<svelte:component this={icons[template.icon]} class="icon icon-sm" />
							<h2 class="grow text-lg font-semibold">{template.name}</h2>
						</div>

						<div class="flex flex-wrap gap-2">
							{#each template.properties as property (property.id)}
								<span
									class="h-6 py-1 px-1.5 flex items-center rounded font-semibold bg-primary text-primary-foreground"
								>
									{property.name}
								</span>
							{:else}
								<span> No properties</span>
							{/each}
						</div>
						<p>{template.description}</p>
					</a>
				{:else}
					<div class="h-[80px] w-full flex items-center justify-center rounded bg-secondary/40">
						<p class=" font-semibold text-xl">Template not found</p>
					</div>
				{/each}
			</div>
		</div>
	</PageContent>
</PageContainer>

<DialogRoot
	open={isPreviewDialogOpen}
	onOpenChange={(open) => {
		if (!open) {
			history.back();
		}
	}}
>
	<DialogContent class="max-w-4xl ">
		<TemplatePage data={noCheck($page.state.template)} />
	</DialogContent>
</DialogRoot>
