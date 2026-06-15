<script lang="ts">
	import { goto, preloadData, pushState } from '$app/navigation';
	import { SortMenu } from '$lib/components/view/index.js';
	import { sortFun, type SortOption } from '$lib/utils/index.js';
	import { PageContainer } from '$lib/components/page/index.js';
	import {
		DEFAULT_SORT_OPTIONS,
		SCREEN_LG_MEDIA_QUERY,
		TEMPLATE_PANEL_CTX_KEY
	} from '$lib/constant/index.js';
	import { tm, noCheck } from '$lib/utils/index.js';
	import { getContext } from 'svelte';
	import { ModalState } from '$lib/states/index.js';
	import TemplatePage from './[id]/+page.svelte';
	import { page } from '$app/state';
	import { MediaQuery } from 'svelte/reactivity';
	import { Card, Empty, ExpandableSearchInput, VSelector } from '$lib/components/base/index.js';

	const TAB_OPTIONS = [{ id: 'all', label: 'All' }];

	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<unknown>[])];

	let { data } = $props();

	let active = $state('');
	let tab = $state(TAB_OPTIONS[0].id);
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

<PageContainer
	icon="templates"
	title="Templates"
	class={tm(templatePanel.isOpen && 'w-0 md:w-1/2')}
>
	<div class="w-full flex justify-between gap-x-1 lg:gap-x-1.5">
		<VSelector value={tab} options={TAB_OPTIONS} onchange={(v) => (tab = v)}></VSelector>
		<div class="w-full flex justify-end gap-x-1 md:gap-x-1.5">
			<ExpandableSearchInput placeholder="Find template" bind:value={search} />

			<SortMenu options={sortOptions} bind:value={sort} />
		</div>
	</div>

	{#if templates.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
			{#each templates as template (template.id)}
				<Card
					icon={template.icon}
					title={template.name}
					href={`/templates/${template.id}`}
					onclick={(e) => clickTemplate(e, template.id)}
					class={tm(template.id === active ? 'border-primary' : '')}
				>
					<p class="text-sm font-medium">{template.description}</p>
				</Card>
			{/each}
		</div>
	{:else}
		<Empty text="No result" />
	{/if}
</PageContainer>

{#if page.state.template}
	<aside
		class={tm(
			'h-full flex flex-col space-y-2 overflow-hidden',
			'rounded-md bg-card text-card-foreground transition-all duration-300',
			templatePanel.isOpen ? 'w-full md:w-2/6 ml-1.5' : 'w-0'
		)}
	>
		<TemplatePage data={noCheck(page.state)} />
	</aside>
{/if}
