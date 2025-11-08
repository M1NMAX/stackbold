<script lang="ts">
	import CircleAlert from 'lucide-svelte/icons/circle-alert';
	import CircleCheck from 'lucide-svelte/icons/circle-check';
	import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
	import Loader from 'lucide-svelte/icons/loader';
	import X from 'lucide-svelte/icons/x';
	import { flip } from 'svelte/animate';
	import { fade, slide } from 'svelte/transition';
	import { buttonVariants } from './button.svelte';
	import { getToastState } from '$lib/states';
	import { tm } from '$lib/utils/index.js';

	type Props = {
		dismissable?: boolean;
	};

	let { dismissable = false }: Props = $props();

	const toastState = getToastState();
</script>

<div
	class="fixed bottom-10 md:bottom-auto md:top-10 z-50 flex flex-col flex-wrap content-center gap-2 w-full"
>
	{#each toastState.toasts as toast (toast.id)}
		<div
			in:slide={{ duration: 150 }}
			out:fade={{ duration: 150 }}
			animate:flip={{ duration: 150 }}
			class={tm(
				'min-w-[18rem] max-w-xs md:md-w-lg flex justify-between items-center space-x-2.5 p-2 rounded-lg shadow-lg group',
				toast.type === 'success' && 'bg-green-50 dark:bg-green-800 text-green-500 dark:text-white',
				toast.type === 'error' && 'bg-red-200 dark:bg-red-800 text-red-600 dark:text-red-100',
				toast.type === 'warning' && 'bg-amber-100 dark:bg-amber-600 text-amber-600 dark:text-white',
				toast.type === 'action' && 'bg-background border border-border',
				toast.type === 'loading' && 'bg-background border border-border'
			)}
		>
			{#if toast.type === 'success'}
				<CircleCheck
					class="size-6 stroke-green-50 dark:stroke-green-800 fill-green-500 dark:fill-green-500"
				/>
			{:else if toast.type === 'error'}
				<CircleAlert class="size-6" />
			{:else if toast.type === 'warning'}
				<TriangleAlert class="size-6 " />
			{:else if toast.type === 'loading'}
				<Loader class="size-6 animate-spin" />
			{/if}
			<span class="grow text-sm font-medium">
				{toast.message}
			</span>

			{#if dismissable || !['action', 'loading'].includes(toast.type)}
				<button onclick={() => toastState.remove(toast.id)}>
					<X class="size-4" />
				</button>
			{/if}

			{#if toast.type === 'action'}
				<button
					onclick={() => toast.action.onclick()}
					class={buttonVariants({ theme: 'secondary', variant: 'compact' })}
				>
					{toast.action.label}
				</button>
			{/if}
		</div>
	{/each}
</div>
