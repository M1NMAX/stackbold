<script lang="ts">
	import { mode, setMode } from 'mode-watcher';
	import {
		Button,
		Dialog,
		Label,
		Tabs,
		TabTrigger,
		TabContent,
		HSeparator,
		Select
	} from '$lib/components/base/index.js';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { trpc } from '$lib/trpc/client';
	import { goto } from '$app/navigation';
	import { superForm } from 'sveltekit-superforms/client';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { getToastState } from '$lib/states';

	let { data } = $props();
	let user = $state(data.user);

	let open = $state(false);
	let confirmed = $state(false);
	let isSaveDisabled = $state(true);
	const toastState = getToastState();

	const { form, message, errors, enhance } = superForm(data.form);

	// FIXME:
	async function handleClickDeleteAccount() {
		try {
			await trpc().users.delete.mutate(user.id);
			toastState.addSuccessToast('Account deleted successfully');
			goto('/');
		} catch (error) {
			toastState.addErrorToast('Unable to delete your account, please try again');
		}
	}

	function goBack() {
		history.back();
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

<PageContainer class=" h-dvh">
	<PageHeader class="justify-between">
		<Button theme="secondary" variant="icon" onclick={() => goBack()}><ChevronLeft /></Button>

		<h1 class="md:hidden grow font-semibold text-2xl">Settings</h1>

		<form method="post" action="/?/logout" use:enhance>
			<Button theme="secondary" type="submit">Logout</Button>
		</form>
	</PageHeader>
	<PageContent>
		<div class="w-full max-w-2xl mx-auto gap-y-2">
			<h1 class="hidden md:block font-semibold text-4xl pb-2">Settings</h1>
			<Tabs value="account" class="my-2">
				{#snippet triggers()}
					<TabTrigger value="account">Account</TabTrigger>
					<TabTrigger value="appearance">Appearance</TabTrigger>
				{/snippet}
				<TabContent value="account">
					<h2 class="text-lg font-semibold">Account</h2>

					<p>Manage your account settings</p>

					<div class="my-4">
						<label for="email" class="label"> Email </label>

						<input
							disabled
							id="email"
							type="email"
							name="email"
							value={$form.email}
							class="input input-ghost"
						/>
					</div>

					{#if $message}
						<div class="msg-error">
							{$message}
						</div>
					{/if}

					TODO: finish account data update
					<form method="post" action="?/updUserData" use:enhance class="space-y-4 my-4">
						<div>
							<label for="name" class="label"> Name </label>
							<input
								id="name"
								type="text"
								name="name"
								value={$form.name}
								oninput={() => (isSaveDisabled = false)}
								class="input input-ghost"
							/>
							{#if $errors.name}
								<span class="mt-2 text-error"> {$errors.name} </span>
							{/if}
						</div>

						<div class="flex items-center justify-end">
							<Button theme="secondary" type="submit" disabled>Save</Button>
						</div>
					</form>

					<HSeparator />

					<div class="mt-2 space-y-4">
						<div>
							<h3 class="text-base font-semibold">Delete account</h3>
							<p class="text-sm">
								Once you delete your account, there is no going back. Please be certain.
							</p>
						</div>
						TODO: finish account deletion
						<Button theme="destructive" class="w-full" disabled onclick={() => (open = true)}>
							Delete account
						</Button>
					</div>
				</TabContent>
				<TabContent value="appearance">
					<h2 class="text-lg font-semibold">Appearance</h2>
					<p>Customize your app appearance</p>

					<div class="my-2 pb-1 rounded-sm text-foreground-muted bg-muted">
						<Label for="app-theme" name="Theme" />
						<Select
							id="app-theme"
							options={setupThemeOptions()}
							onselect={(opt) => {
								const value = opt.id as typeof $mode;
								setMode(value ?? 'system');
							}}
						/>
					</div>
				</TabContent>
			</Tabs>
		</div>
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
