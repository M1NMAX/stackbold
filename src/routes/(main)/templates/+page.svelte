<script lang="ts">
	import { goto, preloadData, pushState } from '$app/navigation';
	import { SortMenu } from '$lib/components/view/index.js';
	import { sortFun, type SortOption } from '$lib/utils/index.js';
	import { PageContainer } from '$lib/components/page/index.js';
	import {
		COLLECTION_ICONS,
		DEFAULT_SORT_OPTIONS,
		SCREEN_LG_MEDIA_QUERY,
		TEMPLATE_CATEGORY_COLORS,
		TEMPLATE_CATEGORY_LABELS,
		TEMPLATE_PANEL_CTX_KEY,
		THEME_COLORS
	} from '$lib/constant/index.js';
	import { tm, noCheck } from '$lib/utils/index.js';
	import { getContext } from 'svelte';
	import { ModalState } from '$lib/states/index.js';
	import TemplatePage from './[id]/+page.svelte';
	import { page } from '$app/state';
	import { MediaQuery } from 'svelte/reactivity';
	import {
		Badge,
		Card,
		Empty,
		ExpandableSearchInput,
		VSelector
	} from '$lib/components/base/index.js';
	import { Color, TemplateCategory } from '@prisma/client';

	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<unknown>[])];

	const TAB_OPTIONS = $derived(setupTabOptions());

	let { data } = $props();

	let active = $state('');
	let tab = $state((() => TAB_OPTIONS[0].id)());
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
				const match = searchableTerms.toLowerCase().includes(searchTerm);

				if (tab === 'all') return match;
				return template.templateCategory === tab && match;
			})
			.sort(sortFun(sort.field, sort.order));
	}

	function setupTabOptions() {
		let options: { id: string; label: string }[] = [];

		options.push({ id: 'all', label: 'All' });

		options.push(
			...Object.values(TemplateCategory).map((category) => ({
				id: category.toString(),
				label: TEMPLATE_CATEGORY_LABELS[category]
			}))
		);

		return options;
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
		<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
			{#each templates as template (template.id)}
				{@const Icon = COLLECTION_ICONS[template.icon]}
				{@const category = template.templateCategory}

				{#if category}
					<Card
						href={`/templates/${template.id}`}
						onclick={(e) => clickTemplate(e, template.id)}
						class={tm(template.id === active ? 'border-primary' : '')}
					>
						<div class={tm('size-8 p-1 rounded-lg', THEME_COLORS[Color.GRAY])}>
							<Icon class="size-6" />
						</div>

						<h2 class="text-sm font-semibold text-nowrap truncate">
							{template.name}
						</h2>
						<p class="grow text-sm font-medium">{template.description}</p>

						<Badge
							color={TEMPLATE_CATEGORY_COLORS[category]}
							text={TEMPLATE_CATEGORY_LABELS[category]}
						></Badge>
					</Card>
				{/if}
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
