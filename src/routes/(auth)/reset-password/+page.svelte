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

<div>
	<h1 class="mb-6 text-center text-3xl font-medium">Reset your password</h1>

	<form method="post" use:enhance class="space-y-4">
		<Field class="py-1" errors={$errors.password}>
			<Label for="password" name="Password" />

			<input
				id="password"
				type="password"
				name="password"
				required
				bind:value={$form.password}
				class="input input-bordered"
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
