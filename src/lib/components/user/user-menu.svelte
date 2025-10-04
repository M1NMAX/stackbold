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
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		HSeparator,
		Label,
		RadioGroup,
		RadioGroupItem
	} from '$lib/components/base/index.js';
	import { ModalState } from '$lib/states/index.js';
	import { slide } from 'svelte/transition';

	type Props = {
		user: User;
	};

	let { user }: Props = $props();
	let avatarUrl = $derived(`https://api.dicebear.com/7.x/shapes/svg?seed=${user.name}`);

	const modeWrapper = new ModalState();

	function handleModeChange(value: string) {
		const valueCasted = value as typeof $mode;
		setMode(valueCasted ?? 'system');
		modeWrapper.close();
	}
</script>

<AdaptiveWrapper
	floatingAlign="start"
	triggerClass={buttonVariants({
		theme: 'secondary',
		className: 'h-8 w-8 p-0.5'
	})}
>
	{#snippet trigger()}
		<img src={avatarUrl} class="h-full w-full object-contain rounded-sm" alt="avatar" />
	{/snippet}

	{#if user.role === 'ADMIN'}
		<Button theme="ghost" variant="menu" onclick={() => goto('/admin')}>
			<Lock class="size-4" />
			<span>Admin</span>
		</Button>
		<HSeparator />
	{/if}

	<Button theme="ghost" variant="menu" onclick={() => modeWrapper.toggle()}>
		<SunMoon />
		<span>Theme</span>
	</Button>

	{#if modeWrapper.isOpen}
		<div transition:slide={{ duration: 150 }} class="flex flex-col items-start space-y-1 px-1">
			<RadioGroup value={$mode ?? 'system'} onchange={handleModeChange} class="w-full">
				<Label for="light" compact hoverEffect>
					<SunDim />
					<span class="grow">Ligh</span>
					<RadioGroupItem id="light" value="light" />
				</Label>

				<Label for="dark" compact hoverEffect>
					<Moon />
					<span class="grow"> Dark </span>
					<RadioGroupItem id="dark" value="dark" />
				</Label>

				<Label for="system" compact hoverEffect>
					<SunMoon />
					<span class="grow">System </span>
					<RadioGroupItem id="system" value="system" />
				</Label>
			</RadioGroup>
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
</AdaptiveWrapper>
