<script lang="ts">
	import type { PageData } from './$types';
	import logoSrc from '$lib/assets/logo.png';
	import { superForm } from 'sveltekit-superforms/client';
	import { Button } from '$lib/components/ui/button';

	export let data: PageData;

	const { form, message, errors, enhance } = superForm(data.form);
</script>

<div>
	<div class="flex justify-center pb-8">
		<img src={logoSrc} alt="logo" />
	</div>

	<h1 class="mb-6 text-center text-3xl font-medium">Reset password</h1>

	{#if $message}
		<div class="msg-error">
			{$message}
		</div>
	{/if}

	<form method="post" use:enhance class="space-y-4">
		<div>
			<label for="email" class="label"> New password </label>
			<input
				id="password"
				type="password"
				name="password"
				required
				bind:value={$form.password}
				class="input input-bordered"
			/>

			{#if $errors.password}
				<span class="text-error"> {$errors.password} </span>
			{/if}
		</div>
		<div>
			<Button type="submit" class="w-full btn btn-primary normal-case">Reset password</Button>
		</div>
	</form>
</div>
