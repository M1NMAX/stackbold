<script lang="ts">
	import { Button, Field, Label } from '$lib/components/base/index.js';
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
	<title>Sign up - Stackbold</title>
</svelte:head>

<div class="auth-form-container">
	<h1>Create an account</h1>

	<form method="post" use:enhance>
		<Field errors={$errors.name}>
			<Label for="name" name="Name" />
			<input
				id="name"
				type="text"
				name="name"
				required
				bind:value={$form.name}
				class="input input-ghost"
			/>
		</Field>

		<Field errors={$errors.email}>
			<Label for="email" name="Email" />
			<input
				id="email"
				type="text"
				name="email"
				required
				bind:value={$form.email}
				class="input input-ghost"
			/>
		</Field>
		<Field errors={$errors.password}>
			<Label for="password" name="Password" />
			<input
				id="password"
				type="password"
				name="password"
				required
				bind:value={$form.password}
				class="input input-ghost"
			/>
		</Field>
		<Button type="submit" class="w-full">Sign up</Button>
	</form>
</div>
<div class="form-link-container">
	Already have an account?
	<a href="/signin" class="link"> Sign in </a>
</div>
