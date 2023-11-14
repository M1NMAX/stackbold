<script lang="ts">
	import logoSrc from '$lib/assets/trpc-logo.png';
	import { enhance } from '$app/forms';

	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<div>
	<div class="flex justify-center pb-8">
		<img src={logoSrc} alt="logo" />
	</div>

	<h1 class="mb-6 text-center text-3xl font-medium">Email verification</h1>

	{#if form?.success}
		<div
			class="px-1 py-4 rounded-sm text-center text-green-200 outline outline-1 outline-green-300 bg-green-700/90"
		>
			<p>Your verification link was resent</p>
		</div>
	{/if}

	<p class="my-4 font-medium text-center text-lg">
		Your email verification link was sent to your inbox (i.e. console).
	</p>

	<form method="post" use:enhance>
		<button type="submit" class="w-full btn btn-primary normal-case"
			>Resend verification link</button
		>
	</form>
</div>
