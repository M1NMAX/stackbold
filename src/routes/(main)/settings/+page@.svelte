<script lang="ts">
	import { enhance } from '$app/forms';
	import { mode, setMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Separator } from '$lib/components/ui/separator';
	import { ArrowLeft } from 'lucide-svelte';
	import * as Tabs from '$lib/components/ui/tabs';
</script>

<svelte:head>
	<title>Settings * Stackbold</title>
</svelte:head>

<div class="grow p-2 bg-gray-50">
	<div class="flex items-center space-x-2">
		<Button variant="secondary" size="icon" on:click={() => history.back()}><ArrowLeft /></Button>
		<h1 class="font-semibold text-2xl">Settings</h1>
	</div>

	<Tabs.Root value="appearance" orientation="vertical" class="w-full flex space-x-4 mt-4 ">
		<Tabs.List class="flex flex-col h-full ">
			<Tabs.Trigger value="appearance">Appearance</Tabs.Trigger>
			<Tabs.Trigger value="account">Account</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="appearance"
			><div>
				<h3 class="text-lg font-medium">Appearance</h3>
				<p class="text-sm text-muted-foreground">
					Customize the appearance of the app. Automatically switch between day and night themes.
				</p>
			</div>
			<Separator />

			<div>
				<h4>Theme</h4>
				<p>Select the theme for the application</p>

				<RadioGroup.Root value={$mode} class="flex">
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
		</Tabs.Content>

		<Tabs.Content value="account">
			<div>
				<form method="post" action="?/logout" use:enhance>
					<Button type="submit">Log out</Button>
				</form>
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>