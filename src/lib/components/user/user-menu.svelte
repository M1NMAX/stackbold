<script lang="ts">
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import BrickWallShield from '@lucide/svelte/icons/brick-wall-shield';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Moon from '@lucide/svelte/icons/moon';
	import Settings from '@lucide/svelte/icons/settings';
	import SunDim from '@lucide/svelte/icons/sun-dim';
	import SunMoon from '@lucide/svelte/icons/sun-moon';
	import { mode, setMode } from 'mode-watcher';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { XUser } from '$lib/types.js';
	import {
		AdaptiveWrapper,
		Avatar,
		Button,
		buttonVariants,
		HSeparator,
		Label,
		RadioGroup,
		RadioGroupItem
	} from '$lib/components/base/index.js';
	import { ModalState } from '$lib/states/index.js';
	import { slide } from 'svelte/transition';
	import { tm } from '$lib/utils/index.js';
	import { Role } from '@prisma/client';
	import { getContext } from 'svelte';
	import { USER_CTX_KEY } from '$lib/constant/index.js';

	type Props = {
		class?: string;
	};

	let { class: className }: Props = $props();
	const user = getContext<XUser>(USER_CTX_KEY);

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
		className: tm('p-0.5 rounded-full', className)
	})}
>
	{#snippet trigger()}
		<Avatar seed={user.name} />
	{/snippet}

	{#if user.role === Role.ADMIN}
		{#if user.inAdmin}
			<Button theme="ghost" variant="menu" onclick={() => goto('/')}>
				<LayoutDashboard />
				<span>App</span>
			</Button>
		{:else}
			<Button theme="ghost" variant="menu" onclick={() => goto('/admin')}>
				<BrickWallShield />
				<span>Admin</span>
			</Button>
		{/if}
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
					<span>Ligh</span>
					<RadioGroupItem id="light" value="light" />
				</Label>

				<Label for="dark" compact hoverEffect>
					<Moon />
					<span> Dark </span>
					<RadioGroupItem id="dark" value="dark" />
				</Label>

				<Label for="system" compact hoverEffect>
					<SunMoon />
					<span>System </span>
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
