<script module lang="ts">
	import { type VariantProps, tv } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: 'shrink-0 select-none ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm text-base md:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
		variants: {
			theme: {
				default: 'bg-primary text-primary-foreground hover:bg-primary/90',
				destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
				outline: 'border-input bg-background hover:bg-accent hover:text-accent-foreground border',
				secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				ghost: 'hover:bg-secondary hover:text-secondary-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
				danger: 'hover:bg-secondary text-red-500'
			},
			variant: {
				default: 'h-9 p-2',
				menu: 'h-9 md:h-7 w-full px-2 justify-start rounded-none md:rounded-sm',
				icon: 'h-9 w-9',
				compact: 'h-6 py-0.5 px-1 gap-1 [&_svg]:size-3.5'
			}
		},
		defaultVariants: {
			theme: 'default',
			variant: 'default'
		}
	});

	export type ButtonTheme = VariantProps<typeof buttonVariants>['theme'];
	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { tm } from '$lib/utils/index.js';

	type Props = HTMLButtonAttributes &
		HTMLAnchorAttributes & {
			theme?: ButtonTheme;
			variant?: ButtonVariant;
		};

	let {
		class: className,
		theme = 'default',
		variant = 'default',

		children,
		href = undefined,
		type = 'button',
		...restProps
	}: Props = $props();
</script>

{#if href}
	<a class={tm(buttonVariants({ theme, variant }), className)} {href} {...restProps}>
		{@render children?.()}
	</a>
{:else}
	<button class={tm(buttonVariants({ theme, variant }), className)} {type} {...restProps}>
		{@render children?.()}
	</button>
{/if}
