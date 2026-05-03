<script lang="ts">
	import { Button, Field, Label } from '$lib/components/base/index.js';
	import { dev } from '$app/environment';
	import { getToastState } from '$lib/states/index.js';
	import { useSuperForm } from '$lib/utils/index.js';
	import { untrack } from 'svelte';

	let { data } = $props();

	const toastState = getToastState();

	const { form, errors, enhance } = useSuperForm(
		untrack(() => data.form),
		toastState
	);
</script>

<svelte:head>
	<title>Sign in - Stackbold</title>
</svelte:head>

<div class="auth-form-container">
	<h1>Sign in to your account</h1>

	<form method="post" use:enhance>
		<Field errors={$errors.email}>
			<Label for="email" name="Email" />
			<input
				required
				id="email"
				type="text"
				name="email"
				class="input ghost"
				bind:value={$form.email}
			/>
		</Field>

		<Field errors={$errors.password}>
			<Label for="password" name="Password" />
			<input
				required
				id="password"
				type="password"
				name="password"
				class="input ghost"
				bind:value={$form.password}
			/>
		</Field>
		<span class="text-sm font-medium">
			<a
				href="/forgot-password"
				tabindex="-1"
				class="no-underline text-primary hover:text-primary/70"
			>
				Forget password?
			</a>
		</span>

		<Button type="submit" class="w-full">Sign in</Button>
	</form>

	{#if dev}
		<div class="form-link-container">
			Don't have an account?
			<a href="/signup" class="link"> Create an account </a>
		</div>
	{/if}
</div>
