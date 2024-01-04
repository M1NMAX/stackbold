<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { AppWindow, Bug, LayoutDashboard, LogOut, Users } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { Sidebar } from '$lib/components/sidebar';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { enhance } from '$app/forms';

	export let data: LayoutData;
	$: ({ user } = data);

	const SIDEBAR_ITEMS = [
		{ label: 'Dashboard', url: '/admin', icon: LayoutDashboard },
		{ label: 'Users', url: '/admin/users', icon: Users },
		{ label: 'Issues', url: '/admin/issues', icon: Bug }
	];
	$: activeUrl = $page.url.pathname;

	$: console.log(activeUrl);
</script>

<div class="h-screen flex bg-secondary">
	<Sidebar class="w-16">
		<div
			class="h-full flex flex-col justify-between space-y-2 py-1.5 px-0 bg-card text-card-foreground"
		>
			<div class="w-full flex flex-col items-center justify-center space-y-0.5">
				{#each SIDEBAR_ITEMS as item (item.url)}
					<a
						href={item.url}
						class={cn(
							'w-full flex items-center justify-center py-1 px-0  hover:bg-secondary',
							activeUrl === item.url && 'border-r-2 border-primary'
						)}
					>
						<svelte:component
							this={item.icon}
							class={cn('icon-lg text-muted-foreground', activeUrl === item.url && 'text-primary')}
						/>
					</a>
				{/each}
			</div>

			<div class="w-full flex flex-col items-center justify-between">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button builders={[builder]} variant="secondary" class="icon-lg p-0.5 rounded-sm">
							<img
								src={`https://api.dicebear.com/7.x/shapes/svg?seed=${user.name}`}
								class="icon-lg object-contain rounded-md"
								alt="avatar"
							/>
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Item href="/" class="space-x-2">
							<AppWindow class="icon-xs" />
							<span> App </span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator />

						<form method="post" action="/?/logout" use:enhance>
							<Button
								variant="ghost"
								type="submit"
								class="w-full h-8 flex justify-start items-center space-x-2 py-1.5 px-2 text-sm rounded-sm"
							>
								<LogOut class="icon-xs" />
								<span>Log out</span>
							</Button>
						</form>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>
	</Sidebar>

	<main class="w-full flex space-x-1 m-1 relative bg-secondary">
		<slot />
	</main>
</div>
