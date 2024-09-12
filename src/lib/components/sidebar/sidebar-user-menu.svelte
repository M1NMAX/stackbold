<script lang="ts">
	import { getScreenState } from '$lib/components/view';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import { Lock, LogOut, PanelLeftInactive, Search, Settings, SunMoon, X } from 'lucide-svelte';
	import { mode, setMode } from 'mode-watcher';
	import { enhance } from '$app/forms';
	import { getSidebarState } from './context';
	import { createEventDispatcher } from 'svelte';

	export let user: import('lucia').User;

	$: avatarUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${user.email?.split('@')[0]}`;
	const dispatch = createEventDispatcher<{ search: null }>();
	const isDesktop = getScreenState();
	const sidebarState = getSidebarState();
</script>

{#if $isDesktop}
	<DropdownMenu.Root>
		<div class="w-full flex items-center justify-between space-x-1">
			<DropdownMenu.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" class="icon-lg p-0.5">
					<img src={avatarUrl} class="icon-lg object-contain rounded-md" alt="avatar" />
				</Button>
			</DropdownMenu.Trigger>
			<Button
				variant="secondary"
				class="grow h-9 justify-between items-center space-x-1"
				on:click={() => dispatch('search')}
			>
				<span class="flex items-center space-x-0.5">
					<Search class="icon-sm" />
					<span> Search</span>
				</span>
				<kbd
					class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-0.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
				>
					<span class="text-xs">Ctrl</span>
					<span>K</span>
				</kbd>
			</Button>

			<Button variant="secondary" size="icon" on:click={() => ($sidebarState = false)}>
				<PanelLeftInactive class="icon-sm" />
				<span class="sr-only"> Hide sidebar </span>
			</Button>
		</div>

		<DropdownMenu.Content class="w-56">
			<DropdownMenu.Label>{user.email}</DropdownMenu.Label>

			{#if user.role === 'ADMIN'}
				<DropdownMenu.Separator />
				<DropdownMenu.Item href="/admin" class="space-x-2">
					<Lock class="icon-xs" />
					<span>Admin</span>
				</DropdownMenu.Item>
			{/if}
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger class="space-x-1">
						<SunMoon class="icon-xs" />
						<span>Theme</span>
					</DropdownMenu.SubTrigger>
					<DropdownMenu.SubContent class="w-46">
						<DropdownMenu.RadioGroup value={$mode}>
							<DropdownMenu.RadioItem value="light" on:click={() => setMode('light')}>
								Light
							</DropdownMenu.RadioItem>
							<DropdownMenu.RadioItem value="dark" on:click={() => setMode('dark')}>
								Dark
							</DropdownMenu.RadioItem>
							<DropdownMenu.RadioItem value="system" on:click={() => setMode('system')}>
								System
							</DropdownMenu.RadioItem>
						</DropdownMenu.RadioGroup>
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>

				<DropdownMenu.Item href="/settings" class="space-x-2">
					<Settings class="icon-xs" />
					<span>Settings</span>
				</DropdownMenu.Item>
			</DropdownMenu.Group>

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
{:else}
	<Drawer.Root>
		<div class="w-full flex justify-between items-center space-x-1">
			<Drawer.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" class="p-0.5 rounded-full">
					<img src={avatarUrl} class="icon-lg object-contain rounded-full" alt="avatar" />
				</Button>
			</Drawer.Trigger>
			<div class="grow flex space-x-1">
				<Button
					variant="secondary"
					on:click={() => dispatch('search')}
					class="grow justify-start px-2 rounded-full "
				>
					<Search class="icon-sm" />
					<span>Search</span>
				</Button>
				<Button
					variant="secondary"
					size="icon"
					on:click={() => ($sidebarState = false)}
					class="rounded-full"
				>
					<X class="icon-sm" />
					<span class="sr-only"> Hide sidebar </span>
				</Button>
			</div>
		</div>

		<Drawer.Content>
			<Drawer.Header class="py-2">
				<Drawer.Title>User</Drawer.Title>
				<Drawer.Description>{user.email}</Drawer.Description>
			</Drawer.Header>

			<Drawer.Footer class="pt-2">
				{#if user.role === 'ADMIN'}
					<Button variant="secondary" href="/admin">
						<Lock class="icon-xs" />
						<span>Admin</span>
					</Button>
				{/if}

				<Button href="/settings" variant="secondary">
					<Settings class="icon-xs" />
					<span>Settings</span>
				</Button>
				<form method="post" action="/?/logout" use:enhance>
					<Button variant="destructive" type="submit" class="w-full">
						<LogOut class="icon-xs" />
						<span>Log out</span>
					</Button>
				</form>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
