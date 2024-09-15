<script module lang="ts">
	import { Calendar, CheckSquare2, Hash, Link, List, Text } from 'lucide-svelte';

	// TODO: find better icons
	const icons: { [idx: string]: any } = {
		text: Text,
		select: List,
		checkbox: CheckSquare2,
		date: Calendar,
		number: Hash,
		url: Link
	};
</script>

<script lang="ts">
	import type { PropertyType } from '@prisma/client';

	type Props = {
		key: PropertyType;
		class?: string;
	};

	let { key, class: className }: Props = $props();
	const Icon = $derived(icons[key.toLowerCase()]);
</script>

<Icon class={className ?? 'icon-sm mr-2'} aria-level="Property type icon" />
