<script lang="ts">
	import { mode, setMode } from 'mode-watcher';
	import {
		Button,
		Dialog,
		Drawer,
		Label,
		RadioGroup,
		RadioGroupItem,
		Tabs,
		TabTrigger,
		TabContent,
		HSeparator
	} from '$lib/components/base/index.js';
	import { ChevronLeft, Moon, Palette, SunDim, SunMoon } from 'lucide-svelte';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { trpc } from '$lib/trpc/client';
	import { goto } from '$app/navigation';
	import { superForm } from 'sveltekit-superforms/client';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { getToastState, ModalState } from '$lib/states';

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

	const drawerState = new ModalState();
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
					<p>Customize the appearance of the app</p>

					<div class="hidden md:block my-4 gap-y-1.5">
						<label for="md-theme" class="font-medium"> Theme </label>
						<p class="text-xs">Select the theme</p>

						<RadioGroup
							id="md-theme"
							value={$mode}
							class="flex"
							onchange={(value) => {
								const valueCasted = value as typeof $mode;
								setMode(valueCasted ?? 'system');
							}}
						>
							<Label
								for="md-light"
								class="flex flex-col [&:has([data-state=checked])>div]:border-primary"
							>
								<RadioGroupItem id="md-light" value="light" class="sr-only" />
								<div
									class="flex flex-col items-center rounded-md border-2 border-muted p-1 hover:border-accent"
								>
									<div class="space-y-2 rounded-sm bg-gray-200 p-2">
										<div class="space-y-2 rounded-md bg-white p-2 shadow-sm">
											<div class="h-2 w-[80px] rounded-lg bg-gray-200"></div>
											<div class="h-2 w-[100px] rounded-lg bg-gray-200"></div>
										</div>

										<div class="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
											<div class="h-4 w-4 rounded-full bg-gray-200"></div>

											<div class="h-2 w-[100px] rounded-lg bg-gray-200"></div>
										</div>
									</div>
								</div>
								<span class="block w-full text-center font-normal"> Light </span>
							</Label>
							<Label
								for="md-dark"
								class="flex flex-col [&:has([data-state=checked])>div]:border-primary"
							>
								<RadioGroupItem id="md-dark" value="dark" class="sr-only" />
								<div
									class="flex flex-col items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground"
								>
									<div class="space-y-2 rounded-sm bg-slate-950 p-2">
										<div class="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
											<div class="h-2 w-[80px] rounded-lg bg-slate-400"></div>

											<div class="h-2 w-[100px] rounded-lg bg-slate-400"></div>
										</div>

										<div class="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
											<div class="h-4 w-4 rounded-full bg-slate-400"></div>

											<div class="h-2 w-[100px] rounded-lg bg-slate-400"></div>
										</div>
									</div>
								</div>
								<span class="block w-full text-center font-normal"> Dark </span>
							</Label>

							<Label
								for="md-system"
								class="flex flex-col [&:has([data-state=checked])>div]:border-primary"
							>
								<RadioGroupItem id="md-system" value="system" class="sr-only" />
								<div
									class="flex flex-col items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent"
								>
									<div class="space-y-2 rounded-sm bg-gray-200 p-2">
										<div class="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
											<div class="h-2 w-[80px] rounded-lg bg-slate-400"></div>

											<div class="h-2 w-[100px] rounded-lg bg-slate-400"></div>
										</div>

										<div class="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
											<div class="h-4 w-4 rounded-full bg-gray-200"></div>

											<div class="h-2 w-[100px] rounded-lg bg-gray-200"></div>
										</div>
									</div>
								</div>
								<span class="block w-full text-center font-normal"> System </span>
							</Label>
						</RadioGroup>
					</div>

					<div class="block md:hidden mt-4">
						<Button theme="secondary" variant="menu" onclick={() => drawerState.open()}>
							<Palette class="icon-sm" />
							<span class="grow text-start"> Theme </span>
							<span class="font-light"> {capitalizeFirstLetter($mode ?? 'system')}</span>
						</Button>

						<Drawer bind:open={drawerState.isOpen}>
							<h1 class="text-center">Theme</h1>
							<RadioGroup
								id="theme"
								value={$mode ?? 'system'}
								onchange={(value) => {
									const valueCasted = value as typeof $mode;
									setMode(valueCasted ?? 'system');
									drawerState.close();
								}}
							>
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
						</Drawer>
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
		<Button theme="destructive" disabled={!confirmed} onclick={handleClickDeleteAccount}
			>Confirm</Button
		>
	</div>
</Dialog>
