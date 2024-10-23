<script lang="ts">
	import { ChevronLeft, Dna } from 'lucide-svelte';
	import { goto, preloadData, pushState } from '$app/navigation';
	import { SearchInput, SortMenu } from '$lib/components/filters';
	import { sortFun, type SortOption } from '$lib/utils/sort';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { icons } from '$lib/components/icon';
	import { DEFAULT_SORT_OPTIONS, TEMPLATE_PANEL_CTX_KEY } from '$lib/constant';
	import { getScreenState } from '$lib/components/view';
	import { cn, noCheck } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { SlidingPanel } from '$lib/components/sliding-panel';
	import { getContext } from 'svelte';
	import { ModalState } from '$lib/components/modal';
	import TemplatePage from './[id]/+page.svelte';
	import { page } from '$app/stores';

	let { data } = $props();
	let active = $state('');

	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<unknown>[])];
	let sort = $state(sortOptions[0]);

	let search = $state('');
	let templates = $derived.by(() => {
		const searchTerm = search.toLowerCase() || '';

		return data.templates
			.filter((template) => {
				const searchableTerms = `${template.name} ${template.description}`;
				return searchableTerms.toLowerCase().includes(searchTerm);
			})
			.sort(sortFun(sort.field, sort.order));
	});

	const templatePanel = getContext<ModalState>(TEMPLATE_PANEL_CTX_KEY);
	const isDesktop = getScreenState();

	async function clickTemplate(e: MouseEvent, id: string) {
		active = id;
		if (!isDesktop) return;
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
</script>

<svelte:head><title>Templates - Stackbold</title></svelte:head>

<PageContainer
	class={cn('ease-in-out duration-300', templatePanel.isOpen ? 'w-0 md:w-1/2' : 'w-full md:w-5/6')}
>
	<PageHeader>
		<Button variant="secondary" size="icon" class="md:hidden" on:click={() => history.back()}>
			<ChevronLeft class="icon-md" />
		</Button>

		{#if isSmHeadingVisible}
			<div class="flex items-center space-x-2">
				<Dna class="icon-md" />
				<h1 class="text-xl font-semibold">Templates</h1>
			</div>
		{/if}
	</PageHeader>

	<PageContent onScroll={handleScroll}>
		<div class="flex items-center space-x-2">
			<Dna class="icon-lg" />
			<h1 class="font-semibold text-2xl">Templates</h1>
		</div>

		<div class="space-y-2">
			<div class="w-full flex justify-between space-x-1 md:space-x-2">
				<SearchInput placeholder="Find Template" bind:value={search} />
				<SortMenu options={sortOptions} bind:value={sort} />
			</div>

			<div class="space-y-2">
				{#each templates as template (template.id)}
					{@const Icon = icons[template.icon]}
					<a
						href={`/templates/${template.id}`}
						onclick={(e) => clickTemplate(e, template.id)}
						class={cn(
							'w-full flex flex-col items-start py-1 px-2 space-y-2 rounded bg-secondary/40 hover:bg-secondary/60 truncate',
							template.id === active && 'rounded-r-none border-r-2 border-primary bg-secondary/80'
						)}
					>
						<div class="w-full flex items-center space-x-2">
							<Icon class=" icon-sm" />
							<span class="text-lg font-semibold">{template.name}</span>
						</div>

						<div class="truncate whitespace-nowrap">{template.description}</div>
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

{#if $page.state.template}
	<SlidingPanel open={templatePanel.isOpen} class="w-full md:w-2/6">
		<TemplatePage data={noCheck($page.state)} />
	</SlidingPanel>
{/if}
