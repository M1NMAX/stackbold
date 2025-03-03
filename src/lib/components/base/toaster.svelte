<script lang="ts">
	import CircleAlert from 'lucide-svelte/icons/circle-alert';
	import CircleCheck from 'lucide-svelte/icons/circle-check';
	import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
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

<div class="absolute left-[40%] top-10 flex flex-col gap-2">
	{#each toastState.toasts as toast (toast.id)}
		<div
			in:slide={{ duration: 150 }}
			out:fade={{ duration: 150 }}
			animate:flip={{ duration: 150 }}
			class={tm(
				'min-w-[20rem] flex justify-between items-center space-x-2.5 p-3 rounded-lg shadow-lg group',
				toast.type === 'success' && 'bg-green-950  border-[0.1px] border-green-900 text-green-400',
				toast.type === 'error' && 'bg-red-700 border-[0.1px] border-red-400 text-red-100',
				toast.type === 'warning' && 'bg-amber-600',
				toast.type === 'action' && 'bg-background'
			)}
		>
			{#if toast.type === 'success'}
				<CircleCheck class="size-6 stroke-green-950 fill-green-400" />
			{:else if toast.type === 'error'}
				<CircleAlert class="size-6" />
			{:else if toast.type === 'warning'}
				<TriangleAlert class="size-6 " />
			{/if}
			<span class="grow text-sm font-medium">
				{toast.message}
			</span>

			{#if dismissable || toast.type !== 'action'}
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
