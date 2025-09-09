<script lang="ts">
	import { VIEW_ICONS } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/index.js';
	import type { ViewType } from '@prisma/client';

	type Props = {
		key: ViewType | 'none';
		class?: string;
	};

	let { key, class: className }: Props = $props();
	const Icon = $derived(VIEW_ICONS[key.toLowerCase()]);
</script>

<Icon class={tm('size-5', className)} aria-level="View type icon" />
