<script lang="ts">
	import { tm } from '$lib/utils';
	import { PAGE_ICONS } from '$lib/constant/index.js';

	type Props = {
		icon: string;
		label: string;
		active: boolean;
		href?: string;
	};

	let { icon, label, href, active = false }: Props = $props();

	const Icon = $derived(PAGE_ICONS[icon]);
</script>

<a
	{href}
	class={tm(
		'w-full flex items-center space-x-1.5 py-1 px-4 [&>svg]:size-5 hover:bg-secondary/95 transition duration-75 text-secondary-foreground',
		active && 'border-r-2 border-primary bg-secondary text-primary'
	)}
>
	<Icon />

	<span class="font-semibold">
		{label}
	</span>
</a>
