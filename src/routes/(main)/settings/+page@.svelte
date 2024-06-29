<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { mode, setMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Separator } from '$lib/components/ui/separator';
	import { ArrowLeft } from 'lucide-svelte';
	import { PageContainer } from '$lib/components/page';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { trpc } from '$lib/trpc/client';
	import { goto, invalidateAll } from '$app/navigation';
	import { superForm, type FormResult } from 'sveltekit-superforms/client';
	import { toast } from 'svelte-sonner';

	export let data: PageData;
	$: ({ user } = data);

	let open = false;
	let confirmed = false;
	let isSaveDisabled = true;

	const { form, message, errors, enhance } = superForm(data.form);

	// FIXME
	async function handleClickDeleteAccount() {
		try {
			await trpc().users.delete.mutate(user.id);
			toast.success('Account deleted successfully');
			goto('/');
		} catch (error) {
			toast.error('Unable to delete your account, please try again');
		}
	}
</script>

<svelte:head>
	<title>Settings - Stackbold</title>
</svelte:head>

<PageContainer>
	<div class="flex items-center space-x-2">
		<Button variant="secondary" size="icon" on:click={() => history.back()}>
			<ArrowLeft />
		</Button>
		<h1 class="font-semibold text-2xl">Settings</h1>
	</div>

	<Tabs.Root value="account" class="w-full max-w-xl mx-auto my-2">
		<Tabs.List>
			<Tabs.Trigger value="account">Account</Tabs.Trigger>
			<Tabs.Trigger value="appearance">Appearance</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="account" class="tab-content">
			<h2 class="text-lg font-semibold">Account</h2>

			<p>Manage your account settings</p>

			{#if $message}
				<div class="msg-error">
					{$message}
				</div>
			{/if}

			<form method="post" action="?/updUserData" use:enhance class="space-y-4 my-4">
				<div>
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

				<div>
					<label for="name" class="label"> Name </label>
					<input
						id="name"
						type="text"
						name="name"
						value={$form.name}
						on:input={() => (isSaveDisabled = false)}
						class="input input-ghost"
					/>
					{#if $errors.name}
						<span class="mt-2 text-error"> {$errors.name} </span>
					{/if}
				</div>

				<div class="flex items-center justify-end">
					<Button variant="secondary" type="submit" disabled={isSaveDisabled}>Save</Button>
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
				<Button variant="destructive" class="w-full" on:click={() => (open = true)}>
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
										<div class="h-2 w-[80px] rounded-lg bg-gray-200" />
										<div class="h-2 w-[100px] rounded-lg bg-gray-200" />
									</div>

									<div class="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
										<div class="h-4 w-4 rounded-full bg-gray-200" />
										<div class="h-2 w-[100px] rounded-lg bg-gray-200" />
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
										<div class="h-2 w-[80px] rounded-lg bg-slate-400" />
										<div class="h-2 w-[100px] rounded-lg bg-slate-400" />
									</div>

									<div class="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
										<div class="h-4 w-4 rounded-full bg-slate-400" />
										<div class="h-2 w-[100px] rounded-lg bg-slate-400" />
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
										<div class="h-2 w-[80px] rounded-lg bg-slate-400" />
										<div class="h-2 w-[100px] rounded-lg bg-slate-400" />
									</div>

									<div class="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
										<div class="h-4 w-4 rounded-full bg-gray-200" />
										<div class="h-2 w-[100px] rounded-lg bg-gray-200" />
									</div>
								</div>
							</div>
							<span class="block w-full p-2 text-center font-normal"> System </span>
						</Label>
					</div>
				</RadioGroup.Root>
			</div>

			<div class="flex md:hidden items-center space-x-1.5 mt-4">
				<label for="theme" class="label"> Theme </label>

				<select id="theme" name="theme" value={$mode} class="select select-ghost">
					<option value="light" on:click={() => setMode('light')}> Light </option>
					<option value="dark" on:click={() => setMode('dark')}> Dark </option>
					<option value="system" on:click={() => setMode('system')}> System </option>
				</select>
			</div>
		</Tabs.Content>
	</Tabs.Root>
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
