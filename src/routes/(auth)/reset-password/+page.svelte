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

<div class="auth-form-container">
	<h1>Reset your password</h1>

	<form method="post" use:enhance>
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
		<Button type="submit" class="w-full">Reset password</Button>
	</form>
</div>
