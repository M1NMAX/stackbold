<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Dna from 'lucide-svelte/icons/dna';
	import { goto, preloadData, pushState } from '$app/navigation';
	import { SearchInput, SortMenu } from '$lib/components/view/index.js';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page/index.js';
	import {
		COLLECTION_ICONS,
		DEFAULT_SORT_OPTIONS,
		SCREEN_LG_MEDIA_QUERY,
		TEMPLATE_PANEL_CTX_KEY
	} from '$lib/constant/index.js';
	import { tm, noCheck } from '$lib/utils/index.js';
	import { Button } from '$lib/components/base/index.js';
	import { getContext } from 'svelte';
	import { ModalState } from '$lib/states/index.js';
	import TemplatePage from './[id]/+page.svelte';
	import { page } from '$app/state';
	import { MediaQuery } from 'svelte/reactivity';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';

	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<unknown>[])];
	let { data } = $props();

	let active = $state('');
	let sort = $state(sortOptions[0]);
	let search = $state('');
	let templates = $derived(filterTemplates());

	const templatePanel = getContext<ModalState>(TEMPLATE_PANEL_CTX_KEY);
	const isLargeScreen = new MediaQuery(SCREEN_LG_MEDIA_QUERY, false);

	async function clickTemplate(e: MouseEvent, id: string) {
		active = id;
		if (!isLargeScreen.current) return;
		e.preventDefault();

		const { href } = e.currentTarget as HTMLAnchorElement;

		const result = await preloadData(href);

		if (result.type === 'loaded' && result.status === 200) {
			pushState(href, { template: result.data.template, insidePanel: true });
			templatePanel.open();
		} else {
			goto(href);
		}
	}

	let isSmHeadingVisible = $state(false);
	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}

	function filterTemplates() {
		const searchTerm = search.toLowerCase() || '';

		return data.templates
			.filter((template) => {
				const searchableTerms = `${template.name} ${template.description}`;
				return searchableTerms.toLowerCase().includes(searchTerm);
			})
			.sort(sortFun(sort.field, sort.order));
	}
</script>

<svelte:head><title>Templates - Stackbold</title></svelte:head>

<PageContainer class={tm(templatePanel.isOpen && 'w-0 md:w-1/2')}>
	<PageHeader>
		<SidebarOpenBtn />
		<Button theme="secondary" variant="icon" class="lg:hidden" onclick={() => history.back()}>
			<ChevronLeft />
		</Button>

		{#if isSmHeadingVisible}
			<div class="grow flex items-center space-x-2">
				<Dna class="size-6" />
				<h1 class="font-semibold text-xl">Templates</h1>
			</div>
		{/if}
	</PageHeader>

	<PageContent onscroll={handleScroll}>
		<div class="flex items-center space-x-2">
			<Dna class="size-7" />
			<h1 class="font-semibold text-2xl">Templates</h1>
		</div>

		<div class="space-y-2">
			<div class="w-full flex justify-between space-x-1 md:space-x-2">
				<SearchInput placeholder="Find Template" bind:value={search} />
				<SortMenu options={sortOptions} bind:value={sort} />
			</div>

			<div class="space-y-2">
				{#each templates as template (template.id)}
					{@const Icon = COLLECTION_ICONS[template.icon]}
					<a
						href={`/templates/${template.id}`}
						onclick={(e) => clickTemplate(e, template.id)}
						class={tm(
							'w-full flex flex-col items-start py-1 px-2 space-y-2 rounded bg-secondary bg-opacity-80 dark:bg-opacity-40 hover:bg-secondary/50 dark:hover:bg-secondary/80 overflow-hidden',
							template.id === active && 'rounded-r-none border-r-2 border-primary bg-secondary/80'
						)}
					>
						<div class="w-full flex items-center space-x-2">
							<Icon class="size-5" />
							<span class="text-lg font-semibold">{template.name}</span>
						</div>

						<p class="">{template.description}</p>
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

{#if page.state.template}
	<aside
		class={tm(
			'h-full flex flex-col space-y-2 p-4 overflow-hidden',
			'rounded-md bg-card text-card-foreground transition-all duration-300',
			templatePanel.isOpen ? 'w-full md:w-2/6 ml-1.5' : 'w-0'
		)}
	>
		<TemplatePage data={noCheck(page.state)} />
	</aside>
{/if}
