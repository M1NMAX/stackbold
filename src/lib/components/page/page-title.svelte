<script lang="ts">
	import { PAGE_ICONS } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/index.js';

	type Props = {
		icon: string;
		title: string;
		small?: boolean;
		class?: string;
	};
	let { icon, title, small = false, class: className }: Props = $props();
	const Icon = $derived(PAGE_ICONS[icon]);
</script>

<div class={tm('flex items-center gap-x-2', className)}>
	<Icon class={tm(small ? 'size-4' : 'size-7')} />
	<h1 class={tm('grow font-semibold', small ? 'text-lg' : 'text-3xl')}>{title}</h1>
</div>
