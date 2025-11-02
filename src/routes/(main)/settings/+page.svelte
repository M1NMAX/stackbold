<script lang="ts">
	import { mode, setMode } from 'mode-watcher';
	import {
		Button,
		Dialog,
		Label,
		Tabs,
		TabTrigger,
		TabContent,
		Select,
		Field
	} from '$lib/components/base/index.js';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import { PageContainer, PageContent, PageHeader, PageTitle } from '$lib/components/page';
	import { trpc } from '$lib/trpc/client';
	import { goto } from '$app/navigation';
	import { capitalizeFirstLetter } from '$lib/utils/index.js';
	import { getToastState } from '$lib/states/index.js';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';

	let { data } = $props();
	let user = $state(data.user);

	let open = $state(false);
	let confirmed = $state(false);
	const toastState = getToastState();

	let isSmHeadingVisible = $state(false);
	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}

	// FIXME:
	async function handleClickDeleteAccount() {
		try {
			await trpc().users.delete.mutate(user.id);
			toastState.success('Account deleted successfully');
			goto('/');
		} catch (error) {
			toastState.error('Unable to delete your account, please try again');
		}
	}

	function setupThemeOptions() {
		return ['light', 'dark', 'system'].map((theme) => ({
			id: theme,
			label: capitalizeFirstLetter(theme),
			isSelected: $mode === theme,
			icon: theme
		}));
	}
</script>

<svelte:head>
	<title>Settings - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader>
		<SidebarOpenBtn />
		<Button theme="secondary" variant="icon" class="lg:hidden" onclick={() => history.back()}>
			<ChevronLeft />
		</Button>
		<PageTitle
			icon="settings"
			title="Settings"
			small
			class={isSmHeadingVisible ? 'grow' : 'hidden'}
		/>
	</PageHeader>
	<PageContent onscroll={handleScroll}>
		<PageTitle icon="settings" title="Settings" />

		<Tabs value="account" class="my-2">
			{#snippet triggers()}
				<TabTrigger value="account">Account</TabTrigger>
				<TabTrigger value="appearance">Appearance</TabTrigger>
			{/snippet}
			<TabContent value="account" class="gap-y-2">
				<section class="flex p-2 rounded-sm bg-secondary">
					<div class="grow">
						<h3 class="text-base font-semibold">Name</h3>
						<p class="text-sm">{data.user.name}</p>
					</div>
					<Button theme="outline">Change Name</Button>
				</section>
				<section class="flex p-2 rounded-sm bg-secondary">
					<div class="grow">
						<h3 class="text-base font-semibold">Email</h3>
						<p class="text-sm">{data.user.email}</p>
					</div>
					<Button theme="outline">Change Email</Button>
				</section>
				<section class="flex p-2 rounded-sm bg-secondary">
					<h3 class="grow text-base font-semibold">Password</h3>
					<Button theme="outline" onclick={() => goto('/settings/update-password')}>
						Change Password
					</Button>
				</section>
				<section class="flex p-2 rounded-sm bg-secondary">
					<h3 class="grow text-base font-semibold">Two-factor authenctication</h3>
					<Button theme="outline" onclick={() => goto('/settings/2fa-setup')}>Setup 2FA</Button>
				</section>
				{#if data.recoveryCode != null}
					<section class="flex p-2 rounded-sm bg-secondary">
						<div class="grow">
							<h3 class="text-base font-semibold">Recovery code</h3>
							<p class="text-sm">{data.recoveryCode}</p>
						</div>
						<Button theme="outline">Generate new code</Button>
					</section>
				{/if}
				<section class="flex flex-col lg:flex-row items-center gap-y-4 p-2 rounded-sm bg-secondary">
					<div class="grow">
						<h3 class="text-base font-semibold">Delete account</h3>
						<p class="text-sm">
							Once you delete your account, there is no going back. Please be certain.
						</p>
					</div>
					<Button theme="destructive" onclick={() => (open = true)}>Delete account</Button>
				</section>
			</TabContent>
			<TabContent value="appearance" class="gap-y-2">
				<Field>
					<Label for="app-theme" name="Theme" />
					<Select
						id="app-theme"
						options={setupThemeOptions()}
						onselect={(opt) => {
							const value = opt.id as typeof $mode;
							setMode(value ?? 'system');
						}}
					/>
				</Field>
			</TabContent>
		</Tabs>
	</PageContent>
</PageContainer>

<Dialog bind:open title="Delete your account" dismissable={false} class="flex flex-col gap-y-2">
	<p class="text-muted-foreground text-base">
		This will permanently delete all your collections and items, and cannot be undone
	</p>
	<label class="label">
		<input type="checkbox" bind:checked={confirmed} class="checkbox" />

		Yes, I want to delete my account
	</label>

	<div class="flex items-center justify-end space-x-2">
		<Button theme="outline" onclick={close}>Cancel</Button>
		<Button theme="destructive" disabled={!confirmed} onclick={handleClickDeleteAccount}>
			Confirm
		</Button>
	</div>
</Dialog>
