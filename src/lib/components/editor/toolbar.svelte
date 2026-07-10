<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Copy from '@lucide/svelte/icons/copy';
	import PencilLine from '@lucide/svelte/icons/pencil-line';
	import X from '@lucide/svelte/icons/x';
	import type { Editor } from '@tiptap/core';
	import { Button } from '$lib/components/base/index.js';
	import { tm, truncateDomain } from '$lib/utils/index.js';
	import { EDITOR_TOOLBAR_ICONS } from '$lib/constant/index.js';
	import { tick } from 'svelte';

	type Props = {
		editor: Editor;
		version: number;
		onEditingLinkChange?: (editing: boolean) => void;
	};

	let { editor, version, onEditingLinkChange }: Props = $props();

	let mode = $state<'default' | 'link-view' | 'link-edit'>('default');
	let linkUrl = $state('');
	let linkInputEl = $state<HTMLInputElement | null>(null);
	let savedSelection = $state<{ from: number; to: number } | null>(null);

	const selectedLinkHref = $derived.by(() => {
		version;
		return editor.getAttributes('link')?.href ?? '';
	});

	const selectionHasLink = $derived.by(() => {
		version;
		return editor.isActive('link') && Boolean(selectedLinkHref);
	});

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
				action: openLinkFromButton
			}
		] as const;
	});

	function saveSelection() {
		const { from, to } = editor.state.selection;
		savedSelection = { from, to };
	}

	function restoreSelection() {
		if (!savedSelection) return editor.chain().focus();

		return editor.chain().focus().setTextSelection(savedSelection);
	}

	function openLinkFromButton() {
		saveSelection();

		if (selectionHasLink) {
			linkUrl = selectedLinkHref;
			mode = 'link-view';
			return;
		}

		linkUrl = '';
		mode = 'link-edit';

		tick().then(() => {
			linkInputEl?.focus();
		});
	}

	function openLinkEditor() {
		saveSelection();
		linkUrl = selectedLinkHref;
		mode = 'link-edit';

		tick().then(() => {
			linkInputEl?.focus();
		});
	}

	function closeLinkMode() {
		mode = 'default';
		linkUrl = '';
		savedSelection = null;

		tick().then(() => {
			editor.chain().focus().run();
		});
	}

	function backFromEditor() {
		if (selectionHasLink || linkUrl.trim()) {
			mode = 'link-view';
		} else {
			closeLinkMode();
		}
	}

	function normalizeUrl(url: string) {
		const trimmed = url.trim();

		if (!trimmed) return '';

		if (/^https?:\/\//i.test(trimmed)) {
			return trimmed;
		}

		return `https://${trimmed}`;
	}

	function applyLink() {
		const url = normalizeUrl(linkUrl);

		if (!url) {
			restoreSelection().unsetLink().run();
			closeLinkMode();
			return;
		}

		restoreSelection().extendMarkRange('link').setLink({ href: url }).run();

		linkUrl = url;
		mode = 'link-view';
	}

	function removeLink() {
		restoreSelection().extendMarkRange('link').unsetLink().run();
		closeLinkMode();
	}

	function openLink() {
		const url = normalizeUrl(linkUrl || selectedLinkHref);

		if (!url) return;

		window.open(url, '_blank', 'noopener,noreferrer');
	}

	async function copyLink() {
		const url = normalizeUrl(linkUrl || selectedLinkHref);

		if (!url) return;

		await navigator.clipboard.writeText(url);
	}

	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			applyLink();
		}

		if (e.key === 'Escape') {
			e.preventDefault();
			backFromEditor();
		}
	}

	$effect(() => {
		onEditingLinkChange?.(mode === 'link-edit' || mode === 'link-view');
	});

	$effect(() => {
		version;

		if (mode === 'link-edit') return;

		if (selectionHasLink) {
			linkUrl = selectedLinkHref;
			mode = 'link-view';
		} else {
			mode = 'default';
			linkUrl = '';
		}
	});
</script>

<div
	role="toolbar"
	aria-label="Text formatting"
	class="flex items-center gap-1 p-1 border border-secondary rounded-md bg-popover shadow-lg"
>
	{#if mode === 'link-edit'}
		<Button
			theme="ghost"
			variant="cicon"
			title="Back"
			onmousedown={(e) => {
				e.preventDefault();
				backFromEditor();
			}}
		>
			<ChevronLeft />
		</Button>

		<input
			bind:this={linkInputEl}
			bind:value={linkUrl}
			type="url"
			placeholder="Enter a URL"
			class="input ghost h-8! lg:h-6! px-0!"
			onkeydown={handleInputKeydown}
		/>

		{#if linkUrl}
			<Button
				theme="ghost"
				variant="cicon"
				title="Remove link"
				onmousedown={(e) => {
					e.preventDefault();
					removeLink();
				}}
			>
				<X />
			</Button>
		{/if}

		<Button
			theme="secondary"
			variant="compact"
			onmousedown={(e) => {
				e.preventDefault();
				applyLink();
			}}
		>
			Done
		</Button>
	{:else if mode === 'link-view'}
		<Button
			theme="ghost"
			variant="compact"
			title="Open link"
			onmousedown={(e) => {
				e.preventDefault();
				openLink();
			}}
		>
			<span class="text-nowrap truncate">
				{truncateDomain(linkUrl, 20)}
			</span>
			<ExternalLink />
		</Button>

		<Button
			theme="ghost"
			variant="cicon"
			title="Copy link"
			onmousedown={(e) => {
				e.preventDefault();
				copyLink();
			}}
		>
			<Copy />
		</Button>

		<Button
			theme="ghost"
			variant="cicon"
			title="Edit link"
			onmousedown={(e) => {
				e.preventDefault();
				openLinkEditor();
			}}
		>
			<PencilLine />
		</Button>
	{:else}
		{#each buttons as btn, i}
			{@const Icon = EDITOR_TOOLBAR_ICONS[btn.icon]}

			{#if Icon}
				<Button
					theme="ghost"
					variant="cicon"
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
	{/if}
</div>
