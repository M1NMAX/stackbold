<script lang="ts">
	import logoSrc from '$lib/assets/trpc-logo.png';
	import { superForm } from 'sveltekit-superforms/client';

	import type { PageData } from './$types';

	export let data: PageData;
	const { form, message, errors, enhance } = superForm(data.form);
</script>

<div>
	<div class="flex justify-center pb-8">
		<img src={logoSrc} alt="logo" />
	</div>

	<h1 class="mb-6 text-center text-3xl font-medium">Create an account</h1>

	{#if $message}
		<div
			class="px-1 py-4 rounded-sm text-center text-red-200 outline outline-1 outline-red-300 bg-red-700/90"
		>
			$message
		</div>
	{/if}
	<form method="post" use:enhance class="space-y-4">
		<div>
			<label for="name" class="label px-0"> Name </label>
			<input
				id="name"
				type="text"
				name="name"
				required
				bind:value={$form.name}
				class="w-full h-9 input input-sm input-ghost bg-gray-200 outline outline-gray-50"
			/>

			{#if $errors.name}
				<span class="mt-2 text-error"> {$errors.name} </span>
			{/if}
		</div>

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
			<label for="password" class="label px-0"> Password </label>
			<input
				id="password"
				type="text"
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
			<button type="submit" class="w-full btn btn-primary normal-case">Sign up</button>
		</div>
	</form>
</div>
<div class="my-8 leading-8 font-medium text-sm">
	<p class="text-center text-gray-500">
		Already have an account?
		<a href="/login" class="no-underline text-primary hover:text-primary/70"> Sign in </a>
	</p>
</div>
