<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { Button, Field, Label } from '$lib/components/base/index.js';

	let { data } = $props();

	const { form, errors, enhance } = superForm(data.form);
</script>

<div>
	<h1 class="mb-6 text-center text-3xl font-medium">Reset your password</h1>

	<form method="post" use:enhance class="space-y-4">
		<Field class="py-1" errors={$errors.email}>
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
		<Button type="submit" class="w-full">Reset password</Button>
	</form>
</div>
<div class="my-8 leading-8 font-medium text-sm">
	<p class="text-center text-gray-500">
		<a href="/signin" class="no-underline text-primary hover:text-primary/70"> Back to Sign in </a>
	</p>
</div>
