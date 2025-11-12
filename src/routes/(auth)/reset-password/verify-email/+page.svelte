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
	<h1 class="form-title">Verify your email address</h1>
	<p class="form-subtitle">We sent an 8-digit code to your email address</p>

	<form method="post" use:enhance>
		<Field class="py-1" errors={$errors.code}>
			<Label for="code" name="Code" />
			<input
				id="code"
				type="text"
				name="code"
				required
				bind:value={$form.code}
				class="input input-ghost"
			/>
		</Field>
		<Button type="submit" class="w-full">Verify</Button>
	</form>
</div>
