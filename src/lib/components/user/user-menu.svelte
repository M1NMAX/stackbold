<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import { Lock, LogOut, Settings, SunMoon } from 'lucide-svelte';
	import { mode, setMode } from 'mode-watcher';
	import { enhance } from '$app/forms';
	import { type User } from 'lucia';
	import { getScreenState } from '$lib/components/screen';
	type Props = {
		user: User;
	};

	let { user }: Props = $props();
	let avatarUrl = $derived(
		`https://api.dicebear.com/7.x/shapes/svg?seed=${user.email?.split('@')[0]}`
	);
	const isDesktop = getScreenState();
</script>

{#if $isDesktop}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger asChild let:builder>
			<Button builders={[builder]} variant="secondary" class="hidden md:flex p-0.5 rounded-full">
				<img src={avatarUrl} class="icon-lg object-contain rounded-full" alt="avatar" />
			</Button>
		</DropdownMenu.Trigger>

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
		<Drawer.Trigger asChild let:builder>
			<Button builders={[builder]} variant="secondary" class="md:hidden p-0.5 rounded-full">
				<img src={avatarUrl} class="icon-lg object-contain rounded-full" alt="avatar" />
			</Button>
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
