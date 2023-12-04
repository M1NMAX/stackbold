<script lang="ts" context="module">
	export type ToastData =
		| { type: 'success' | 'error'; message: string }
		| { type: 'redirect'; message: string; url: string };

	const {
		elements: { content, description },
		helpers,
		states: { toasts },
		actions: { portal }
	} = createToaster<ToastData>();

	export const addToast = helpers.addToast;
</script>

<script lang="ts">
	import { flip } from 'svelte/animate';
	import { createToaster, melt } from '@melt-ui/svelte';
	import { fly } from 'svelte/transition';
	import { CheckCircle2, XCircle } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
</script>

<div class="fixed inset-x-0 top-0 z-50 m-2 flex flex-col items-center gap-2" use:portal>
	{#each $toasts as { id, data } (id)}
		<div
			{...$content(id)}
			animate:flip={{ duration: 500 }}
			in:fly={{ duration: 150, y: '-50%' }}
			out:fly={{ duration: 150, x: '100%' }}
			class="rounded-md bg-neutral-800 text-white shadow-md"
		>
			<div class="flex w-[24rem] max-w-[calc(100vw-2rem)] items-center justify-between gap-4 p-2">
				<div class="w-full flex items-center space-x-2">
					{#if data.type === 'success' || data.type === 'redirect'}
						<CheckCircle2 class="text-green-500" />
					{:else if data.type === 'error'}
						<XCircle class="text-red-500" />
					{/if}

					<div use:melt={$description(id)} class="grow">
						{data.message}
					</div>

					{#if data.type === 'redirect'}
						<Button href={data.url} size="sm">Go</Button>
					{/if}
				</div>
			</div>
		</div>
	{/each}
</div>
