<script lang="ts">
	import { tm } from '$lib/utils/index.js';
	import Egg from 'lucide-svelte/icons/egg';

	type Props = {
		icon?: boolean;
		text: string;
		class?: string;
	};

	let { icon = false, text, class: className }: Props = $props();
</script>

<div class={tm('h-full flex flex-col justify-center items-center gap-y-2', className)}>
	{#if icon}
		<Egg class="size-10" />
	{/if}

	<p class="text-center text-base font-medium">
		{text}
	</p>
</div>
