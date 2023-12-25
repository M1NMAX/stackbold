<script lang="ts">
	import type { PageData } from './$types';
	import { Dna } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { PROPERTY_COLORS } from '$lib/constant';
	import { Root as DialogRoot, Content as DialogContent } from '$lib/components/ui/dialog';
	import { goto, preloadData, pushState } from '$app/navigation';
	import { SearchInput } from '$lib/components/search';
	import debounce from 'debounce';
	import { SortDropdown, setSortState, sortOptions } from '$lib/components/sort';
	import { sortFun } from '$lib/utils/sort';
	import TemplatePage from './[id]/+page.svelte';
	import { page } from '$app/stores';
	import { PageContent } from '$lib/components/page';
	import { ICON_COLORS, icons } from '$lib/components/icon';

	export let data: PageData;
	$: ({ templates } = data);

	let isPreviewDialogOpen = false;

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
</script>

<svelte:head><title>Templates - Stackbold</title></svelte:head>

<div class="grow rounded-md bg-card text-secondary-foreground overflow-hidden">
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
							<svelte:component
								this={icons[template.icon.name]}
								class={cn('icon-sm', ICON_COLORS[template.icon.color])}
							/>
							<h2 class="grow text-lg font-semibold">{template.name}</h2>
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
					</a>
				{:else}
					<div class="h-[80px] w-full flex items-center justify-center rounded bg-secondary/40">
						<p class=" font-semibold text-xl">Template not found</p>
					</div>
				{/each}
			</div>
		</div>
	</PageContent>
</div>

<DialogRoot
	open={isPreviewDialogOpen}
	onOpenChange={(open) => {
		if (!open) {
			history.back();
		}
	}}
>
	<DialogContent class="max-w-4xl">
		<TemplatePage data={$page.state.template} />
	</DialogContent>
</DialogRoot>
