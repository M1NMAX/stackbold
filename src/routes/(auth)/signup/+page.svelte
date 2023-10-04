<script lang="ts">
	import { Alert, Button, Helper, Input, Label } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';

	import type { PageData } from './$types';

	export let data: PageData;
	const { form, message, errors, enhance } = superForm(data.form);
</script>

<h1 class=" text-center text-3xl text-gray-900">Create Account</h1>

{#if $message}
	<Alert>{$message}</Alert>
{/if}

<form method="post" use:enhance>
	<div class="grid gap-6 mb-6">
		<div>
			<Label for="username" class="mb-2">Username</Label>
			<Input
				type="text"
				id="username"
				name="username"
				placeholder="John"
				required
				bind:value={$form.username}
			/>
			{#if $errors.username}
				<Helper class="mt-2" color="red">
					{$errors.username}
				</Helper>
			{/if}
		</div>

		<div class="mb-6">
			<Label for="password" class="mb-2">Password</Label>
			<Input
				type="password"
				id="password"
				name="password"
				placeholder="•••••••••"
				required
				bind:value={$form.password}
			/>

			{#if $errors.password}
				<Helper class="mt-2" color="red">
					{$errors.password}
				</Helper>
			{/if}
		</div>
		<Button type="submit">Submit</Button>
	</div>
</form>

<Button href="/login" outline class="w-full">Sign in</Button>
