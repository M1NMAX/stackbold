<script lang="ts">
	import logoSrc from '$lib/assets/trpc-logo.png';
	import { superForm } from 'sveltekit-superforms/client';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';

	export let data: PageData;

	const { form, message, errors, enhance } = superForm(data.form);
</script>

<div>
	<div class="flex justify-center pb-8">
		<img src={logoSrc} alt="logo" />
	</div>

	<h1 class="mb-6 text-center text-3xl font-medium">Reset your password</h1>

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
			<Button type="submit" class="w-full">Reset password</Button>
		</div>
	</form>
</div>
<div class="my-8 leading-8 font-medium text-sm">
	<p class="text-center text-gray-500">
		<a href="/login" class="no-underline text-primary hover:text-primary/70"> Back to Sign in </a>
	</p>
</div>
