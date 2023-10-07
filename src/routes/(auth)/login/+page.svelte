<script lang="ts">
	import { Input, Label, Button, Alert, Helper } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	// import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';

	import type { PageData } from './$types';

	export let data: PageData;
	const { form, message, errors, enhance } = superForm(data.form);
</script>

<!-- <SuperDebug data={$form} /> -->
<h1 class=" text-center text-3xl text-gray-900">Login</h1>

{#if $message}
	<Alert>{$message}</Alert>
{/if}

<form method="post" use:enhance>
	<div class="grid gap-6 mb-6">
		<div>
			<Label for="email" class="mb-2">Email</Label>
			<Input
				type="text"
				id="email"
				name="email"
				placeholder="john@email.com"
				required
				bind:value={$form.email}
			/>

			{#if $errors.email}
				<Helper class="mt-2" color="red">
					{$errors.email}
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

<Button href="/signup" outline class="w-full">Create an account</Button>
<Button href="/password-reset" outline class="w-full">Reset password</Button>
