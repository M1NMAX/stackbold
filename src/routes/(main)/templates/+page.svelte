<script lang="ts">
	import type { PageData } from './$types';
	import { onDestroy } from 'svelte';
	import { Dna } from 'lucide-svelte';
	import { Root as DialogRoot, Content as DialogContent } from '$lib/components/ui/dialog';
	import { goto, preloadData, pushState } from '$app/navigation';
	import { SearchInput, createSearchStore, searchHandler } from '$lib/components/search';
	import { SortDropdown, setSortState } from '$lib/components/sort';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import TemplatePage from './[id]/+page.svelte';
	import { page } from '$app/stores';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { icons } from '$lib/components/icon';
	import type { Template } from '@prisma/client';
	import { DEFAULT_SORT_OPTIONS } from '$lib/constant';

	export let data: PageData;

	let isPreviewDialogOpen = false;

	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<Template>[])];

	const sort = setSortState(sortOptions[0]);

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
	function noCheck(x: any) {
		return x;
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

	$: if ($page.state.template) {
		isPreviewDialogOpen = true;
	} else {
		isPreviewDialogOpen = false;
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
			<div class="w-full flex justify-between space-x-2">
				<SearchInput placeholder="Find Template" bind:value={$searchStore.search} />
				<SortDropdown {sortOptions} bind:currentSort={$sort} />
			</div>

			<div class="space-y-2">
				{#each $searchStore.filtered as template (template.id)}
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
