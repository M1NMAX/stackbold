<script lang="ts">
	import { INPUT_ICONS } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/index.js';
	import type { PropertyType } from '@prisma/client';

	type Props = {
		key: PropertyType | 'none';
		class?: string;
	};

	let { key, class: className }: Props = $props();
	const Icon = $derived(INPUT_ICONS[key.toLowerCase()]);
</script>

<Icon class={tm('size-5', className)} aria-level="Property type icon" />
