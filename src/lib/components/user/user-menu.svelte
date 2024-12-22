<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Lock, LogOut, Settings, SunMoon } from 'lucide-svelte';
	import { mode, setMode } from 'mode-watcher';
	import { enhance } from '$app/forms';
	import { getScreenSizeState } from '$lib/components/screen';
	import { goto } from '$app/navigation';
	import type { User } from '$lib/server/user';
	type Props = {
		user: User;
	};

	let { user }: Props = $props();
	let avatarUrl = $derived(
		`https://api.dicebear.com/7.x/shapes/svg?seed=${user.email?.split('@')[0]}`
	);
	const isLargeScreen = getScreenSizeState();
</script>

{#if isLargeScreen.current}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={buttonVariants({
				variant: 'secondary',
				className: 'hidden md:flex p-0.5 rounded-sm'
			})}
		>
			<img src={avatarUrl} class="icon-lg object-contain rounded-sm" alt="avatar" />
		</DropdownMenu.Trigger>

		<DropdownMenu.Content class="w-56">
			<DropdownMenu.Label>{user.email}</DropdownMenu.Label>

			{#if user.role === 'ADMIN'}
				<DropdownMenu.Separator />
				<DropdownMenu.Item onclick={() => goto('/admin')} class="space-x-2">
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
							<DropdownMenu.RadioItem value="light" onclick={() => setMode('light')}>
								Light
							</DropdownMenu.RadioItem>
							<DropdownMenu.RadioItem value="dark" onclick={() => setMode('dark')}>
								Dark
							</DropdownMenu.RadioItem>
							<DropdownMenu.RadioItem value="system" onclick={() => setMode('system')}>
								System
							</DropdownMenu.RadioItem>
						</DropdownMenu.RadioGroup>
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>

				<DropdownMenu.Item onclick={() => goto('/settings')} class="space-x-2">
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
		<Drawer.Trigger
			class={buttonVariants({ variant: 'secondary', className: 'md:hidden p-0.5 rounded-sm' })}
		>
			<img src={avatarUrl} class="icon-lg object-contain rounded-sm" alt="avatar" />
		</Drawer.Trigger>

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
