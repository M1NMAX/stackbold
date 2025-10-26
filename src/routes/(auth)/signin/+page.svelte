<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { Button, Field, Label } from '$lib/components/base/index.js';
	import { dev } from '$app/environment';
	import { getToastState } from '$lib/states/index.js';

	let { data } = $props();

	const toastState = getToastState();
	const { form, errors, enhance } = superForm(data.form, {
		onResult: ({ result }) => {
			if (result.type != 'failure') return;
			if (result.data == null || result.data.form.errors._errors == null) return;
			toastState.error(result.data.form.errors._errors);
		}
	});
</script>

<svelte:head>
	<title>Sign in - Stackbold</title>
</svelte:head>

<div>
	<h1 class="mb-6 text-center text-3xl font-medium">Sign in to your account</h1>

	<form method="post" use:enhance class="space-y-4">
		<Field class="py-1" errors={$errors.email}>
			<Label for="email" name="Email" />
			<input
				required
				id="email"
				type="text"
				name="email"
				class="input input-ghost"
				bind:value={$form.email}
			/>
		</Field>

		<Field class="py-1" errors={$errors.password}>
			<Label for="password" name="Password" />
			<input
				required
				id="password"
				type="password"
				name="password"
				class="input input-ghost"
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
		<div class="my-8 leading-8 font-medium text-sm">
			<p class="text-center text-gray-500">
				Don't have an account?
				<a href="/signup" class="no-underline text-primary hover:text-primary/70">
					Create an account
				</a>
			</p>
		</div>
	{/if}
</div>
