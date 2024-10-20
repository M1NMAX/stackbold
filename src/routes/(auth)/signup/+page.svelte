<script lang="ts">
	import logoSrc from '$lib/assets/logo.png';
	import { superForm } from 'sveltekit-superforms/client';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
	const { form, message, errors, enhance } = superForm(data.form);
</script>

<svelte:head>
	<title>Sign up - Stackbold</title>
</svelte:head>

<div>
	<div class="flex justify-center pb-8">
		<img src={logoSrc} alt="logo" />
	</div>

	<h1 class="mb-6 text-center text-3xl font-medium">Create an account</h1>

	{#if $message}
		<div class="msg-error">
			{$message}
		</div>
	{/if}
	<form method="post" use:enhance class="space-y-4">
		<div>
			<label for="email" class="label"> Email </label>
			<input
				id="email"
				type="text"
				name="email"
				required
				bind:value={$form.email}
				class="input input-bordered"
			/>

			{#if $errors.email}
				<span class="mt-2 text-error"> {$errors.email} </span>
			{/if}
		</div>

		<div>
			<label for="password" class="label"> Password </label>
			<input
				id="password"
				type="password"
				name="password"
				required
				bind:value={$form.password}
				class="input input-bordered"
			/>

			{#if $errors.password}
				<span class="text-error"> {$errors.password} </span>
			{/if}
		</div>

		<div>
			<Button type="submit" class="w-full">Sign up</Button>
		</div>
	</form>
</div>
<div class="my-8 leading-8 font-medium text-sm">
	<p class="text-center text-gray-500">
		Already have an account?
		<a href="/signin" class="no-underline text-primary hover:text-primary/70"> Sign in </a>
	</p>
</div>
