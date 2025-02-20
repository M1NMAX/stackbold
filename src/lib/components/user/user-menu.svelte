<script lang="ts">
	import Lock from 'lucide-svelte/icons/lock';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Moon from 'lucide-svelte/icons/moon';
	import Settings from 'lucide-svelte/icons/settings';
	import SunDim from 'lucide-svelte/icons/sun-dim';
	import SunMoon from 'lucide-svelte/icons/sun-moon';
	import { mode, setMode } from 'mode-watcher';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { User } from '$lib/server/user';
	import { Button, buttonVariants, HSeparator, Menu } from '$lib/components/base/index.js';
	import { ModalState } from '$lib/states/index.js';
	import { slide } from 'svelte/transition';

	type Props = {
		user: User;
	};

	let { user }: Props = $props();
	let avatarUrl = $derived(`https://api.dicebear.com/7.x/shapes/svg?seed=${user.name}`);

	const expasionState = new ModalState();
</script>

<Menu
	align="end"
	triggerClass={buttonVariants({
		theme: 'secondary',
		className: 'p-0.5'
	})}
>
	{#snippet trigger()}
		<img src={avatarUrl} class="size-8 object-contain rounded-sm" alt="avatar" />
	{/snippet}

	{#if user.role === 'ADMIN'}
		<Button theme="ghost" variant="menu" onclick={() => goto('/admin')}>
			<Lock class="icon-xs" />
			<span>Admin</span>
		</Button>
		<HSeparator />
	{/if}

	<Button theme="ghost" variant="menu" onclick={() => expasionState.toggle()}>
		<SunMoon />
		<span>Theme</span>
	</Button>

	{#if expasionState.isOpen}
		<div transition:slide={{ duration: 150 }} class="flex flex-col items-start space-y-1 px-1">
			<Button theme="ghost" variant="menu" onclick={() => setMode('light')}>
				<SunDim />
				<span> Light </span>

				{#if $mode === 'light'}
					<span class="ml-auto size-2 rounded-full bg-primary"> </span>
				{/if}
			</Button>
			<Button theme="ghost" variant="menu" onclick={() => setMode('dark')}>
				<Moon />
				<span class="grow text-start"> Dark </span>

				{#if $mode === 'dark'}
					<span class="ml-auto size-2 rounded-full bg-primary"> </span>
				{/if}
			</Button>
		</div>
		<HSeparator />
	{/if}

	<Button theme="ghost" variant="menu" onclick={() => goto('/settings')}>
		<Settings />
		<span>Settings</span>
	</Button>

	<HSeparator />

	<form method="post" action="/?/logout" use:enhance>
		<Button theme="ghost" variant="menu" type="submit">
			<LogOut />
			<span>Log out</span>
		</Button>
	</form>
</Menu>
