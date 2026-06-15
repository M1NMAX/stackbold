<script lang="ts">
	import { PAGE_ICONS } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/index.js';

	type Props = {
		title: string;
		icon?: string;
		small?: boolean;
		class?: string;
	};
	let { icon, title, small = false, class: className }: Props = $props();
</script>

<div class={tm('flex items-center gap-x-2 min-w-0 ', className)}>
	{#if icon}
		{@const Icon = PAGE_ICONS[icon]}

		<Icon class={tm('shrink-0', small ? 'size-4' : 'size-7')} />
	{/if}

	<h1 class={tm('grow font-semibold truncate', small ? 'text-lg' : 'text-3xl')}>
		{title}
	</h1>
</div>
