<script lang="ts">
	import { mode, setMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Separator } from '$lib/components/ui/separator';
	import { ChevronLeft, Moon, Palette, Sun, SunMoon } from 'lucide-svelte';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { trpc } from '$lib/trpc/client';
	import { goto } from '$app/navigation';
	import { superForm } from 'sveltekit-superforms/client';
	import { toast } from 'svelte-sonner';
	import * as Drawer from '$lib/components/ui/drawer';
	import { capitalizeFirstLetter } from '$lib/utils';

	let { data } = $props();
	let user = $state(data.user);

	let open = $state(false);
	let confirmed = $state(false);
	let isSaveDisabled = $state(true);

	const { form, message, errors, enhance } = superForm(data.form);

	// FIXME:
	async function handleClickDeleteAccount() {
		try {
			await trpc().users.delete.mutate(user.id);
			toast.success('Account deleted successfully');
			goto('/');
		} catch (error) {
			toast.error('Unable to delete your account, please try again');
		}
	}

	function goBack() {
		history.back();
	}
</script>

<svelte:head>
	<title>Settings - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageHeader class="justify-between md:justify-end">
		<Button variant="secondary" class="md:hidden" on:click={() => goBack()}><ChevronLeft /></Button>

		<h1 class="md:hidden grow font-semibold text-2xl">Settings</h1>

		<form method="post" action="/?/logout" use:enhance>
			<Button variant="secondary" type="submit">Logout</Button>
		</form>
	</PageHeader>
	<PageContent>
		<Tabs.Root value="account" class="w-full max-w-xl mx-auto my-2">
			<h1 class="hidden md:block font-semibold text-4xl pb-2">Settings</h1>
			<Tabs.List>
				<Tabs.Trigger value="account">Account</Tabs.Trigger>
				<Tabs.Trigger value="appearance">Appearance</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="account" class="tab-content">
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

				<!-- TODO: finish account data update -->
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
						<!-- <Button variant="secondary" type="submit" disabled={isSaveDisabled}>Save</Button> -->
						<Button variant="secondary" type="submit" disabled>Save</Button>
					</div>
				</form>

				<Separator />

				<div class="mt-2 space-y-4">
					<div>
						<h3 class="text-base font-semibold">Delete account</h3>
						<p class="text-sm">
							Once you delete your account, there is no going back. Please be certain.
						</p>
					</div>
					<!-- TODO: finish account deletion -->
					<Button variant="destructive" class="w-full" disabled on:click={() => (open = true)}>
						Delete account
					</Button>
				</div>
			</Tabs.Content>
			<Tabs.Content value="appearance" class="tab-content">
				<h2 class="text-lg font-semibold">Appearance</h2>
				<p>Customize the appearance of the app</p>

				<div class="hidden md:block my-4 space-y-1.5">
					<label for="theme-radio" class="font-medium"> Theme </label>
					<p class="text-xs">Select the theme</p>

					<RadioGroup.Root id="theme-radio" value={$mode} class="flex">
						<div class="flex items-center space-x-2">
							<Label for="light" class="[&:has([data-state=checked])>div]:border-primary">
								<RadioGroup.Item
									id="light"
									value="light"
									class="sr-only"
									on:click={() => setMode('light')}
								/>
								<div class="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
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
								<span class="block w-full p-2 text-center font-normal"> Light </span>
							</Label>
						</div>
						<div class="flex items-center space-x-2">
							<Label for="dark" class="[&:has([data-state=checked])>div]:border-primary">
								<RadioGroup.Item
									id="dark"
									value="dark"
									class="sr-only"
									on:click={() => setMode('dark')}
								/>
								<div
									class="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground"
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
								<span class="block w-full p-2 text-center font-normal"> Dark </span>
							</Label>
						</div>

						<div class="flex items-center space-x-2">
							<Label for="system" class="[&:has([data-state=checked])>div]:border-primary">
								<RadioGroup.Item
									id="system"
									value="system"
									class="sr-only"
									on:click={() => setMode('system')}
								/>
								<div
									class="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent"
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
								<span class="block w-full p-2 text-center font-normal"> System </span>
							</Label>
						</div>
					</RadioGroup.Root>
				</div>

				<div class="visible md:hidden mt-4">
					<Drawer.Root>
						<Drawer.Trigger asChild let:builder class="bg-primary">
							<Button builders={[builder]} variant="secondary" class="w-full justify-start">
								<Palette class="icon-sm" />
								<span class="grow text-start"> Theme </span>
								<span class="font-light"> {capitalizeFirstLetter($mode ?? 'system')}</span>
							</Button>
						</Drawer.Trigger>
						<Drawer.Content>
							<Drawer.Header class="py-1">
								<div class="flex items-center space-x-2">
									<div class="p-2.5 rounded bg-secondary">
										<Palette class="icon-sm" />
									</div>
									<div class="text-base font-semibold">Theme</div>
								</div>
							</Drawer.Header>
							<Drawer.Footer class="pt-2 space-y-2">
								<RadioGroup.Root
									id="theme"
									value={$mode}
									class="px-2 py-1 rounded-md bg-secondary/40"
								>
									<div class="flex items-center justify-between">
										<Label for="light" class="grow flex items-center font-semibold text-base">
											<Sun class="icon-sm mr-2" />
											Light
										</Label>
										<RadioGroup.Item id="light" value="light" on:click={() => setMode('light')} />
									</div>
									<div class="flex items-center justify-between">
										<Label for="dark" class="grow flex items-center font-semibold text-base">
											<Moon class="icon-sm mr-2" />
											Dark
										</Label>

										<RadioGroup.Item id="dark" value="dark" on:click={() => setMode('dark')} />
									</div>

									<div class="flex items-center justify-between">
										<Label for="system" class="grow flex items-center font-semibold text-base">
											<SunMoon class="icon-sm mr-2" />
											System
										</Label>

										<RadioGroup.Item
											id="system"
											value="system"
											on:click={() => setMode('system')}
										/>
									</div>
								</RadioGroup.Root>
							</Drawer.Footer>
						</Drawer.Content>
					</Drawer.Root>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</PageContent>
</PageContainer>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete your account</AlertDialog.Title>
			<AlertDialog.Description class="text-lg">
				This will permanently delete all your collections and items, and cannot be undone
			</AlertDialog.Description>
		</AlertDialog.Header>

		<label class="label">
			<input type="checkbox" bind:checked={confirmed} class="checkbox" />

			Yes, I want to delete my account
		</label>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action asChild let:builder>
				<Button
					builders={[builder]}
					variant="destructive"
					disabled={!confirmed}
					on:click={handleClickDeleteAccount}>Delete</Button
				>
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
