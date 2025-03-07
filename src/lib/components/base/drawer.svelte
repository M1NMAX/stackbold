<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tm } from '$lib/utils/index.js';
	import { sineIn } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	type Props = {
		children: Snippet;
		open: boolean;
		class?: string;
	};

	let { children, open = $bindable(false), class: className }: Props = $props();

	function draggableAction<T extends HTMLElement>(node: T) {
		let startY = 0;
		let currentY = 0;
		let isDragging = false;

		function handlePointerDown(e: PointerEvent) {
			if (e.buttons === 2) return;

			startY = e.clientY;
			currentY = 0;
			isDragging = true;

			node.setPointerCapture(e.pointerId);
			e.preventDefault();
		}

		function handlePointerMove(e: PointerEvent) {
			if (!isDragging) return;
			e.preventDefault();

			const deltaY = e.clientY - startY;
			currentY = deltaY;

			if (deltaY > 0) node.style.transform = `translateY(${currentY}px)`;
		}

		function handlePointerUp(e: PointerEvent) {
			if (!isDragging) return;

			node.releasePointerCapture(e.pointerId);

			if (currentY > 100) close();
			else node.style.transform = 'translateY(0px)';

			isDragging = false;
			e.preventDefault();
		}

		$effect(() => {
			node.style.touchAction = 'none';
			node.addEventListener('pointerdown', handlePointerDown);
			node.addEventListener('pointermove', handlePointerMove);
			node.addEventListener('pointerup', handlePointerUp);
			node.addEventListener('pointercancel', handlePointerUp);

			return () => {
				node.removeEventListener('pointerdown', handlePointerDown);
				node.removeEventListener('pointermove', handlePointerMove);
				node.removeEventListener('pointerup', handlePointerUp);
				node.removeEventListener('pointercancel', handlePointerUp);
			};
		});
	}

	function close() {
		open = false;
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		role="presentation"
		class="fixed top-0 start-0 z-50 w-full h-full bg-black/80"
		onclick={close}
	></div>
	<div
		use:draggableAction
		transition:fly={{ y: 320, duration: 200, easing: sineIn }}
		class="w-full fixed inset-x-0 bottom-0 z-50 p-2 overscroll-y-contain"
	>
		<div
			class={tm(
				'flex flex-col py-1 rounded-xl overflow-y-auto bg-background border-[1.5px] border-muted',
				className
			)}
		>
			<div class="bg-muted mx-auto mt-1 mb-1.5 h-1 w-[50px] rounded-full"></div>
			{@render children()}
		</div>
	</div>
{/if}
