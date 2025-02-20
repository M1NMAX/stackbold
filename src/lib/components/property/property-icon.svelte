<script lang="ts">
	import { INPUT_ICONS } from '$lib/constant/index.js';
	import type { PropertyType } from '@prisma/client';

	type Props = {
		key: PropertyType | 'none';
		class?: string;
	};

	let { key, class: className }: Props = $props();
	const Icon = $derived(INPUT_ICONS[key.toLowerCase()]);
</script>

<Icon class={className ?? 'icon-sm mr-2'} aria-level="Property type icon" />
