<script lang="ts">
	import { enhance } from '$app/forms';
	import { mode, setMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Separator } from '$lib/components/ui/separator';
	import { ArrowLeft } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Settings - Stackbold</title>
</svelte:head>

<div class="h-screen p-1 bg-secondary overflow-hidden">
	<main
		class="h-full w-full mx-auto p-2 lg:p-8 space-y-2 rounded-md bg-card text-secondary-foreground"
	>
		<!-- <div class="grow rounded-md bg-card text-secondary-foreground overflow-hidden"> -->
		<div class="flex items-center space-x-2">
			<Button variant="secondary" size="icon" on:click={() => history.back()}>
				<ArrowLeft />
			</Button>
			<h1 class="font-semibold text-2xl">Settings</h1>
		</div>

		<div
			class="flex flex-col lg:flex-row justify-center space-y-4 lg:space-y-0.5 lg:space-x-10 mx-auto"
		>
			<div class="w-full lg:max-w-xl p-4 rounded border">
				<h4>Theme</h4>
				<p>Select the theme for the application</p>

				<RadioGroup.Root value={$mode} class="flex my-4">
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
			<div class="w-full lg:max-w-xl p-4 rounded border">
				<h2>Account</h2>

				<p>Manage your account settings</p>

				<div class="flex flex-col my-4">
					<label for="name"> Name </label>

					<input
						id="name"
						type="text"
						name="name"
						class="w-fll h-9 input input-ghost bg-gray-200"
					/>
				</div>

				<div class="flex flex-col my-4">
					<label for="password"> Password </label>

					<input
						id="password"
						type="password"
						name="password"
						class="w-fll h-9 input input-ghost bg-gray-200"
					/>
				</div>

				<Separator />
				<div class="mt-4">
					<Button variant="destructive" class="w-full">Delete account</Button>
				</div>
			</div>
		</div>
	</main>
</div>
