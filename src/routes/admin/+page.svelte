<script lang="ts">
	import { Badge, Card, HSeparator } from '$lib/components/base';
	import { PageContainer, PageContent, PageHeader, PageTitle } from '$lib/components/page';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';
	import { UserMenu } from '$lib/components/user/index.js';
	import { COLLECTION_ICONS, PAGE_ICONS } from '$lib/constant/icons.js';
	import { HEALTH_STATUS_COLORS } from '$lib/constant/index.js';
	import { timeAgo } from '$lib/utils/index.js';
	import { Color } from '@prisma/client';

	type Counter = {
		label: string;
		counter: string;
		grow: string;
	};
	type SectionContent = {
		icon: string;
		title: string;
		counters: Counter[];
	};

	let { data } = $props();

	const releases = [
		{
			version: 'v0.82.3',
			date: '2025-05-28',
			relativeDate: '1 day ago',
			badgeColor: undefined,
			changes: ['Bulk import via CSV', 'Improved sharing permissions', 'Performance fixes']
		},
		{
			version: 'v0.82.2',
			date: '2025-05-22',
			relativeDate: '1 week ago',
			badgeColor: Color.RED,
			changes: ['Templates gallery', 'Drag-and-drop reordering', 'Dark mode']
		}
	];
</script>

<svelte:head>
	<title>Admin - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader>
		<SidebarOpenBtn />
		<PageTitle small icon="dashboardadmin" title="Admin" />
		<UserMenu inAdmin user={data.user} class="flex lg:hidden" />
	</PageHeader>
	<PageContent>
		<div class="flex flex-col gap-y-3">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
				<Card icon="pulse" title="System">
					{#each data.systems as sys, i (sys.name)}
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">{sys.name}</span>
							<Badge color={HEALTH_STATUS_COLORS[sys.status]}>
								{sys.status}
							</Badge>
						</div>

						{#if i + 1 !== data.systems.length}
							<HSeparator class="my-0" />
						{/if}
					{/each}
				</Card>

				<Card url="/admin/users" class="flex flex-col lg:flex-row gap-y-3 lg:gap-x-2">
					{@render cardSection({
						icon: 'users',
						title: 'Users',
						counters: [
							{ label: 'Total', ...data.users.total },
							{ label: 'MAU', ...data.users.mau }
						]
					})}

					{@render cardSection({
						icon: 'collections',
						title: 'Collections',
						counters: [
							{ label: 'Total', ...data.collections.total },
							{ label: 'Items', ...data.collections.items }
						]
					})}
				</Card>
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
				<Card icon="release" title="Release">
					{#each releases as release, i (release.version)}
						<div>
							<div class="w-full flex items-center justify-between">
								<Badge color={release.badgeColor}>{release.version}</Badge>
								<span class="text-xs text-muted-foreground"> {release.relativeDate} </span>
							</div>
							<ul class="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
								{#each release.changes as c}
									<li>{c}</li>
								{/each}
							</ul>
						</div>
						{#if i + 1 !== releases.length}
							<HSeparator />
						{/if}
					{/each}
				</Card>

				<Card url="/admin/templates" icon="dna" title="Templates">
					<div>
						{#each data.templates as template, i (template.id)}
							{@const Icon = COLLECTION_ICONS[template.icon]}
							<div class="flex items-center justify-between gap-x-2">
								<Icon class="size-4" />
								<span class="grow"> {template.name} </span>

								<span class="text-xs shrink-0">
									{timeAgo(template.updatedAt)}
								</span>
							</div>
							{#if i + 1 !== data.templates.length}
								<HSeparator class="my-0" />
							{/if}
						{/each}
					</div>
				</Card>
			</div>
		</div>
	</PageContent>
</PageContainer>

{#snippet cardSection(content: SectionContent)}
	{@const Icon = PAGE_ICONS[content.icon]}
	<div class="w-full lg:w-1/2 flex flex-col gap-y-2">
		<h2 class="flex items-center gap-x-2 font-semibold text-sm">
			<Icon class="size-4" />
			{content.title}
		</h2>
		<div class="grow flex items-center gap-x-8">
			{#each content.counters as c (`${c.label}-${c.counter}`)}
				{@render counter(c)}
			{/each}
		</div>
	</div>
{/snippet}

{#snippet counter(c: Counter)}
	<div class="flex flex-col">
		<span class="text-xs text-muted-foreground"> {c.label}</span>
		<span class="grow text-4xl font-semibold">{c.counter}</span>
		<span class="text-right text-base font-semibold text-green-600"> {c.grow} </span>
	</div>
{/snippet}
