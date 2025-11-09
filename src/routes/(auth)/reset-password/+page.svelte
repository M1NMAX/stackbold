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
	<h1 class="form-title mb-6">Reset your password</h1>

	<form method="post" use:enhance>
		<Field class="py-1" errors={$errors.password}>
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
		<Button type="submit" class="w-full">Reset password</Button>
	</form>
</div>
