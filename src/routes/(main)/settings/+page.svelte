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
	import { PageContent, PageHeader, PageTitle } from '$lib/components/page/index.js';
	import { trpc } from '$lib/trpc/client';
	import { goto } from '$app/navigation';
	import { capitalizeFirstLetter } from '$lib/utils/index.js';
	import { getToastState, ModalState } from '$lib/states/index.js';

	let { data } = $props();
	let user = $state(data.user);
	let isSmHeadingVisible = $state(false);
	let confirmed = $state(false);

	const toastState = getToastState();
	const deleteDialog = new ModalState();
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

<PageHeader>
	<Button theme="secondary" variant="icon" onclick={() => history.back()}>
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
			<div class="section">
				<div class="grow">
					<h3 class="title">Name</h3>
					<p class="content">{data.user.name}</p>
				</div>
				<Button theme="outline" href="/settings/update-name">Change Name</Button>
			</div>
			<div class="section">
				<div class="grow">
					<h3 class="title">Email</h3>
					<p class="content">{data.user.email}</p>
				</div>
				<Button theme="outline" href="/settings/update-email">Change Email</Button>
			</div>
			<div class="section">
				<h3 class="grow title">Password</h3>
				<Button theme="outline" href="/settings/update-password">Change Password</Button>
			</div>
			<div class="section">
				<h3 class="grow title">Two-factor authenctication</h3>
				<Button theme="outline" href="/settings/2fa-setup">Setup 2FA</Button>
			</div>
			{#if data.recoveryCode != null}
				<div class="section">
					<div class="grow">
						<h3 class="title">Recovery code</h3>
						<p class="content">
							You can use this recovery code if you lose access to your second factors.
						</p>
					</div>
					<Button theme="outline" href="/settings/recovery-code">See code</Button>
				</div>
			{/if}
			<div class="section">
				<div class="grow">
					<h3 class="title">Delete account</h3>
					<p class="content">
						Once you delete your account, there is no going back. Please be certain.
					</p>
				</div>
				<Button theme="destructive" onclick={() => deleteDialog.open()}>Delete my account</Button>
			</div>
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

<Dialog bind:open={deleteDialog.isOpen} title="Delete your account" dismissable={false}>
	<p class="text-muted-foreground text-base">
		This will permanently delete all your collections and items, and cannot be undone
	</p>
	<label class="label">
		<input type="checkbox" bind:checked={confirmed} class="checkbox" />
		Yes, I want to delete my account
	</label>

	<div class="flex items-center justify-end space-x-2">
		<Button theme="outline" onclick={() => deleteDialog.close()}>Cancel</Button>
		<Button theme="destructive" disabled={!confirmed} onclick={handleClickDeleteAccount}>
			Confirm
		</Button>
	</div>
</Dialog>

<style>
	.section {
		@apply flex flex-col lg:flex-row lg:items-center gap-2 p-2 rounded-md bg-secondary;

		& > .grow > .title,
		& > .title {
			@apply text-base font-semibold;
		}

		& > .grow > .content {
			@apply text-sm;
		}
	}
</style>
