<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import { Button } from '$lib/components/base/index.js';
	import { tm } from '$lib/utils/index.js';
	import { EDITOR_TOOLBAR_ICONS } from '$lib/constant/index.js';

	type Props = {
		editor: Editor;
		version: number;
	};

	let { editor, version }: Props = $props();

	const buttons = $derived.by(() => {
		version;

		return [
			{
				icon: 'bold',
				label: 'Bold',
				active: () => editor.isActive('bold'),
				action: () => editor.chain().focus().toggleBold().run()
			},
			{
				icon: 'italic',
				label: 'Italic',
				active: () => editor.isActive('italic'),
				action: () => editor.chain().focus().toggleItalic().run()
			},
			{
				icon: 'underline',
				label: 'Underline',
				active: () => editor.isActive('underline'),
				action: () => editor.chain().focus().toggleMark('underline').run()
			},
			{
				icon: 'code',
				label: 'Inline code',
				active: () => editor.isActive('code'),
				action: () => editor.chain().focus().toggleCode().run()
			},
			{
				icon: 'link',
				label: 'Link',
				active: () => editor.isActive('link'),
				action: handleLink
			}
		] as const;
	});

	function handleLink() {
		const url = window.prompt('URL', editor.getAttributes('link').href);
		if (url === null) return false;
		if (url === '') {
			return editor.chain().focus().unsetLink().run();
		} else {
			return editor.chain().focus().setLink({ href: url }).run();
		}
	}
</script>

<div
	role="toolbar"
	aria-label="Text formatting"
	class="flex items-center gap-0.5 p-1 border-2 border-secondary rounded-lg bg-popover shadow-lg"
>
	{#each buttons as btn}
		{@const Icon = EDITOR_TOOLBAR_ICONS[btn.icon]}

		{#if Icon}
			<Button
				theme="ghost"
				variant="icon"
				class={tm(btn.active() ? 'bg-secondary/70' : 'bg-transparent')}
				title={btn.label}
				aria-pressed={btn.active()}
				onmousedown={(e) => {
					e.preventDefault();
					btn.action();
				}}
			>
				<Icon />
			</Button>
		{/if}
	{/each}
</div>
