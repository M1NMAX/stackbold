<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const checkboxVariants = tv({
		slots: {
			root: 'relative inline-flex shrink-0 items-center justify-center',
			box: [
				'pointer-events-none flex size-full items-center justify-center rounded-md border-2 border-secondary bg-input/30 transition-colors',
				'peer-checked:border-primary peer-checked:bg-primary',
				'peer-indeterminate:border-primary peer-indeterminate:bg-primary',
				'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
				'peer-disabled:opacity-50',
				'peer-aria-invalid:border-destructive',
				'[&>svg]:opacity-0 [&>svg]:transition-opacity',
				'peer-checked:[&>svg]:opacity-100 peer-indeterminate:[&>svg]:opacity-100',
				'peer-enabled:peer-hover:[&>svg]:opacity-60 peer-checked:peer-hover:[&>svg]:opacity-100'
			]
		},
		variants: {
			size: {
				sm: { root: 'size-3.5', box: '[&>svg]:size-2.5' },
				md: { root: 'size-4', box: '[&>svg]:size-3' },
				lg: { root: 'size-5', box: '[&>svg]:size-3.5' },
				xl: { root: 'size-6', box: '[&>svg]:size-4' }
			}
		},
		defaultVariants: {
			size: 'md'
		}
	});

	export type CheckboxSize = NonNullable<VariantProps<typeof checkboxVariants>['size']>;
</script>

<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Minus from '@lucide/svelte/icons/minus';
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = Omit<HTMLInputAttributes, 'type' | 'children' | 'size'> & {
		class?: string;
		size?: CheckboxSize;
	};

	let {
		checked = $bindable(false),
		indeterminate = $bindable(false),
		size,
		class: className,
		...rest
	}: Props = $props();

	const styles = $derived(checkboxVariants({ size }));
</script>

<span class={styles.root()}>
	<input
		type="checkbox"
		bind:checked
		bind:indeterminate
		class="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
		{...rest}
	/>

	<span aria-hidden="true" class={styles.box({ class: className })}>
		{#if indeterminate}
			<Minus strokeWidth={5} class="text-primary-foreground" />
		{:else}
			<Check strokeWidth={5} class="text-primary-foreground" />
		{/if}
	</span>
</span>
