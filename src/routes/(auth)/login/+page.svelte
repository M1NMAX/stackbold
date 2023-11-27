<script lang="ts">
	import logoSrc from '$lib/assets/trpc-logo.png';
	import { superForm } from 'sveltekit-superforms/client';
	// import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';

	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';

	export let data: PageData;
	const { form, message, errors, enhance } = superForm(data.form);
</script>

<!-- <SuperDebug data={$form} /> -->

<div>
	<div class="flex justify-center pb-8">
		<img src={logoSrc} alt="logo" />
	</div>

	<h1 class="mb-6 text-center text-3xl font-medium">Sign in to your account</h1>

	{#if $message}
		<div
			class="px-1 py-4 rounded-sm text-center text-red-200 outline outline-1 outline-red-300 bg-red-700/90"
		>
			{$message}
		</div>
	{/if}

	<form method="post" use:enhance class="space-y-4">
		<div>
			<label for="email" class="label px-0"> Email </label>
			<input
				id="email"
				type="text"
				name="email"
				required
				bind:value={$form.email}
				class="w-full h-9 input input-sm input-ghost bg-gray-200 outline outline-gray-50"
			/>

			{#if $errors.email}
				<span class="mt-2 text-error"> {$errors.email} </span>
			{/if}
		</div>

		<div>
			<div class="flex items-center justify-between">
				<label for="password" class="label px-0"> Password </label>
				<span class="text-sm font-medium">
					<a
						href="/password-reset"
						tabindex="-1"
						class="no-underline text-primary hover:text-primary/70"
					>
						Forget password?
					</a>
				</span>
			</div>
			<input
				id="password"
				type="password"
				name="password"
				required
				bind:value={$form.password}
				class="w-full h-9 input input-sm input-ghost bg-gray-200 outline outline-gray-50"
			/>

			{#if $errors.password}
				<span class="mt-2 text-error"> {$errors.password} </span>
			{/if}
		</div>

		<div>
			<Button type="submit" class="w-full">Sign in</Button>
		</div>
	</form>

	<div class="my-8 leading-8 font-medium text-sm">
		<p class="text-center text-gray-500">
			Don't have an account?
			<a href="/signup" class="no-underline text-primary hover:text-primary/70">
				Create an account
			</a>
		</p>
	</div>
</div>
