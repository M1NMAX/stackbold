<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Refresh from '@lucide/svelte/icons/refresh-cw';
	import { Badge, Button, Card } from '$lib/components/base';
	import { PageContainer, PageContent, PageHeader, PageTitle } from '$lib/components/page/index.js';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';
	import { HEALTH_STATUS, HEALTH_STATUS_COLORS, THEME_COLORS } from '$lib/constant/index.js';
	import { trpc } from '$lib/trpc/client';
	import type { HealthStatus, Nullable, ServiceHealth } from '$lib/types.js';
	import { onMount } from 'svelte';
	import { formatIsoTime, tm } from '$lib/utils/index.js';

	type Summary = {
		services: ServiceHealth[];
		overall: HealthStatus;
		checkedAt: string;
	};

	let { data } = $props();
	let loading = $state(false);
	let system = $state<Nullable<Summary>>(null);

	async function refresh() {
		loading = true;
		try {
			const client = trpc();
			const start = Date.now();
			await client.admin.ping.query();
			const apiLatency = Date.now() - start;
			const result = await client.admin.systemSummary.query();
			system = {
				overall: result.overall,
				checkedAt: result.checkedAt,
				services: [
					{ name: 'API', status: HEALTH_STATUS.HEALTHY, latency: apiLatency },
					...result.services
				]
			};
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		refresh();
		const interval = setInterval(refresh, 50_000);
		return () => clearInterval(interval);
	});
</script>

<PageContainer>
	<PageHeader>
		<SidebarOpenBtn />

		<Button theme="secondary" variant="icon" class="lg:hidden" onclick={() => history.back()}>
			<ChevronLeft />
		</Button>
		<PageTitle small title="System" class="flex lg:hidden" />
	</PageHeader>
	<PageContent>
		<div class="hidden lg:flex items-center justify-between pb-2">
			<PageTitle icon="system" title="System" />
		</div>

		<div class="w-full flex items-center justify-between gap-x-1 md:gap-x-1.5">
			{#if system}
				<Badge color={HEALTH_STATUS_COLORS[system.overall]}>
					{system.overall}
				</Badge>
			{:else}
				<Badge>—</Badge>
			{/if}

			<div class="flex items-center gap-x-1.5">
				<span class="font-semibold text-xs text-muted-foreground">
					{system ? `Last checked ${formatIsoTime(system.checkedAt)}` : 'Not yet checked'}
				</span>
				<Button theme="outline" onclick={refresh} disabled={loading}>
					<Refresh class={tm(loading && 'animate-spin')} />
					<span>{loading ? 'Checking…' : 'Refresh'}</span>
				</Button>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			{#each system?.services ?? data.system.services as service (service.name)}
				<Card>
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">{service.name}</span>
						<Badge color={HEALTH_STATUS_COLORS[service.status]}>
							{service.status}
						</Badge>
					</div>
					<div class="text-sm font-mono">{service.latency} ms</div>
				</Card>
			{/each}
		</div>
	</PageContent>
</PageContainer>
