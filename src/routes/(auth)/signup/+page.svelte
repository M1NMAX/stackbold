<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { Button, Field, Label } from '$lib/components/base/index.js';
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
	<title>Sign up - Stackbold</title>
</svelte:head>

<div>
	<h1 class="form-title mb-6">Create an account</h1>

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
