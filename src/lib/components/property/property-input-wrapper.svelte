<script lang="ts">
	import { PropertyIcon } from '.';
	import type { Property } from '@prisma/client';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		children: Snippet;
		property: Property;
		isFocus?: boolean;
	};

	let { children, property, isFocus = false }: Props = $props();
</script>

<div
	class={cn(
		'p-1 rounded-sm bg-secondary bg-opacity-80 dark:bg-opacity-40 hover:bg-secondary/40 dark:hover:bg-secondary/60 text-secondary-foreground',
		isFocus && 'bg-secondary/80'
	)}
>
	<div class="flex justify-between items-center gap-x-1 px-1">
		{#if property.type !== 'CHECKBOX'}
			<PropertyIcon key={property.type} class="icon-xs mr-0" />
		{:else}
			{@render children()}
		{/if}

		<label
			for={property.id}
			class="grow flex justify-between items-center py-1 px-0.5 font-semibold text-sm select-none"
		>
			{property.name}
		</label>
	</div>

	{#if property.type !== 'CHECKBOX'}
		{@render children()}
	{/if}
</div>
