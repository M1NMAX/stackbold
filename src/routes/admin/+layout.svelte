<script lang="ts">
	import Sidebar from '$lib/components/sidebar/sidebar.svelte';
	import { Bug, LayoutDashboard, Users } from 'lucide-svelte';
	import type { LayoutData } from './$types';
	import Button from '$lib/components/ui/button/button.svelte';

	export let data: LayoutData;
	$: ({ user } = data);

	const SIDEBAR_ITEMS = [
		{ label: 'Dashboard', url: '/admin/', icon: LayoutDashboard },
		{ label: 'Users', url: '/admin/users', icon: Users },
		{ label: 'Issues', url: '/admin/issues', icon: Bug }
	];
</script>

<div class="h-screen flex bg-secondary">
	<Sidebar class="w-16">
		<div
			class="h-full flex flex-col justify-between space-y-2 py-1.5 px-0 bg-card text-card-foreground"
		>
			<div class="w-full flex flex-col items-center justify-center space-y-4">
				{#each SIDEBAR_ITEMS as item (item.url)}
					<a href={item.url}>
						<svelte:component this={item.icon} class="icon-lg text-muted-foreground" />
					</a>
				{/each}
			</div>

			<div class="w-full flex flex-col items-center justify-between">
				<Button variant="secondary" class="icon-xl p-0.5 rounded-full">
					<img
						src={`https://api.dicebear.com/7.x/shapes/svg?seed=${user.name}`}
						class="h-9 w-9 object-contain rounded-full"
						alt="avatar"
					/>
				</Button>
			</div>
		</div>
	</Sidebar>

	<div class="w-full flex space-x-1 m-1 relative bg-secondary">
		<slot />
	</div>
</div>
