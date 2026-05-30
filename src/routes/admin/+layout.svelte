<script lang="ts">
	import { Button } from '$lib/components/base';
	import { setSidebarState, SidebarItem } from '$lib/components/sidebar';
	import { UserMenu } from '$lib/components/user/index.js';
	import { PAGE_ICONS } from '$lib/constant';
	import { tm } from '$lib/utils';
	import { PanelLeftInactive } from 'lucide-svelte';

	let { data, children } = $props();

	let activeUrl = $state<string>('/admin');
	const SIDEBAR_ITEMS = [
		{ label: 'Dashboard', url: '/admin', icon: 'dashboardadmin' },
		{ label: 'System', url: '/admin/system', icon: 'pulse' },
		{ label: 'Users', url: '/admin/users', icon: 'users' },
		{ label: 'Release', url: '/admin/release', icon: 'release' },
		{ label: 'Templates', url: '/admin/templates', icon: 'templates' },
		{ label: 'Settings', url: '/admin/settings', icon: 'settingsadmin' }
	];

	const BOTTOM_BAR_ITEMS = [
		{ label: 'Dashboard', url: '/admin', icon: 'structure' },
		{ label: 'Users', url: '/admin/users', icon: 'users' }
	];

	const sidebarState = setSidebarState();

	function isBottomBarItemActive() {
		return BOTTOM_BAR_ITEMS.map((item) => item.url).includes(activeUrl);
	}
</script>

<div class="h-dvh w-screen flex flex-col overflow-hidden bg-secondary dark:bg-background">
	<div
		class={tm(
			'w-full h-full lg:grow flex lg:flex-row gap-0 p-0 md:p-1 overflow-hidden bg-secondary dark:bg-background',
			isBottomBarItemActive() && 'flex-col'
		)}
	>
		<!-- SIDEBAR -->
		<aside
			class={tm(
				'hidden lg:flex h-full flex-col gap-y-2.5 rounded-md py-4 overflow-hidden bg-card text-card-foreground transition-all duration-300',
				sidebarState.isOpen ? 'w-[18rem] mr-1.5 shrink-0' : 'w-0'
			)}
		>
			<div class="flex items-start justify-between gap-x-1.5 px-4">
				{#if data.user}
					<UserMenu inAdmin user={data.user} />
				{/if}

				<Button
					theme="secondary"
					class="h-8"
					onclick={() => (sidebarState.isOpen = !sidebarState.isOpen)}
				>
					<PanelLeftInactive />
					<span class="sr-only">Toggle sidebar</span>
				</Button>
			</div>

			<div>
				{#each SIDEBAR_ITEMS as item (item.url)}
					<SidebarItem
						icon={item.icon}
						label={item.label}
						href={item.url}
						active={activeUrl === item.url}
					/>
				{/each}
			</div>
		</aside>
		<!-- SIDEBAR -->

		{@render children()}

		<aside
			class={tm(
				'flex lg:hidden justify-around items-center bg-secondary',
				!isBottomBarItemActive() && 'hidden'
			)}
		>
			{#each BOTTOM_BAR_ITEMS as item}
				{@const Icon = PAGE_ICONS[item.icon]}
				<Button
					href={item.url}
					theme="ghost"
					class={[
						'grow h-16 flex flex-col items-center justify-center space-x-0 [&_svg]:size-5 hover:text-primary hover:bg-transparent',
						activeUrl === item.url && 'text-primary'
					]}
				>
					<Icon />
					<span class="text-xs font-semibold">{item.label}</span>
				</Button>
			{/each}
		</aside>
	</div>
</div>
