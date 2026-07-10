<script lang="ts">
	import { onMount, onDestroy, mount, unmount } from 'svelte';
	import { GripVertical } from '@lucide/svelte';
	import { Editor, type JSONContent } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import Typography from '@tiptap/extension-typography';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '@tiptap/extension-task-item';
	import Image from '@tiptap/extension-image';
	import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
	import DragHandle from '@tiptap/extension-drag-handle';
	import { createLowlight, common } from 'lowlight';
	import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
	import { NodeSelection } from '@tiptap/pm/state';
	import tippy, { type Instance as TippyInstance } from 'tippy.js';
	import { CommandMenu, Toolbar } from './index.js';
	import {
		COMMANDS,
		createCommandsExtension,
		type CommandItem,
		type CommandRenderFactory
	} from './extensions/index.js';

	type Props = {
		content?: string | JSONContent;
		placeholder?: string;
		onUpdate?: (content: JSONContent) => void;
	};

	let {
		content = $bindable(''),
		placeholder = "Write, type '/' for commands…",
		onUpdate
	}: Props = $props();

	const lowlight = createLowlight(common);

	let version = $state(0);
	let editor = $state<Editor | null>(null);
	let editorEl: HTMLDivElement;

	let toolbarFloatEl = $state<HTMLDivElement | null>(null);
	let toolbarTippy: TippyInstance | null = null;
	let toolbarIsEditingLink = $state(false);
	let toolbarResetToken = $state(0);

	let commandTippy: TippyInstance | null = null;
	let commandInstance: ReturnType<typeof mount> | null = null;
	let commandItems: CommandItem[] = $state([]);
	let commandSelectedIdx = $state(0);
	let commandCb: ((item: CommandItem) => void) | null = null;

	let blockMenuTippy: TippyInstance | null = null;
	let blockMenuInstance: ReturnType<typeof mount> | null = null;
	let blockMenuSelectedIndex = $state(0);
	let blockMenuNode: ProseMirrorNode | null = null;
	let blockMenuPos: number | null = null;

	function buildCommandRenderer(): CommandRenderFactory {
		return () => {
			let el: HTMLDivElement;

			return {
				onStart(props) {
					commandItems = props.items;
					commandSelectedIdx = 0;
					commandCb = props.command;

					el = document.createElement('div');
					commandInstance = mount(CommandMenu, {
						target: el,
						props: {
							items: commandItems,
							selectedIndex: commandSelectedIdx,
							onSelect: (item: CommandItem) => {
								commandCb?.(item);
								commandTippy?.hide();
							}
						}
					});

					commandTippy = tippy(document.body, {
						getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
						appendTo: () => document.body,
						content: el,
						showOnCreate: true,
						interactive: true,
						arrow: false,
						trigger: 'manual',
						placement: 'bottom-start'
					});
				},

				onUpdate(props) {
					commandItems = props.items;
					commandSelectedIdx = 0;
					commandCb = props.command;

					if (commandInstance) unmount(commandInstance);
					commandInstance = mount(CommandMenu, {
						target: el,
						props: {
							items: commandItems,
							selectedIndex: commandSelectedIdx,
							onSelect: (item: CommandItem) => {
								commandCb?.(item);
								commandTippy?.hide();
							}
						}
					});

					commandTippy?.setProps({
						getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect()
					});
				},

				onKeyDown({ event }) {
					if (event.key === 'Escape') {
						commandTippy?.hide();
						return true;
					}
					if (event.key === 'ArrowDown') {
						commandSelectedIdx = (commandSelectedIdx + 1) % (commandItems.length || 1);
						refreshSlashMenu(el);
						return true;
					}
					if (event.key === 'ArrowUp') {
						commandSelectedIdx =
							(commandSelectedIdx - 1 + (commandItems.length || 1)) % (commandItems.length || 1);
						refreshSlashMenu(el);
						return true;
					}
					if (event.key === 'Enter') {
						const item = commandItems[commandSelectedIdx];

						if (item) {
							commandCb?.(item);
							commandTippy?.hide();
						}
						return true;
					}
					return false;
				},

				onExit() {
					commandTippy?.destroy();
					commandTippy = null;
					if (commandInstance) {
						unmount(commandInstance);
						commandInstance = null;
					}
				}
			};
		};
	}

	function refreshSlashMenu(el: HTMLDivElement) {
		if (commandInstance) unmount(commandInstance);
		commandInstance = mount(CommandMenu, {
			target: el,
			props: {
				items: commandItems,
				selectedIndex: commandSelectedIdx,
				onSelect: (item: CommandItem) => {
					commandCb?.(item);
					commandTippy?.hide();
				}
			}
		});
	}

	function updateToolbar() {
		if (!editor) return;

		const { selection } = editor.state;

		if (selection.empty || selection instanceof NodeSelection) {
			closeToolbar();
			return;
		}

		const { ranges } = selection;
		const fromPosition = Math.min(...ranges.map((r) => r.$from.pos));
		const toPosition = Math.max(...ranges.map((r) => r.$to.pos));
		const startCoords = editor.view.coordsAtPos(fromPosition);
		const endCoords = editor.view.coordsAtPos(toPosition);

		const rect = new DOMRect(
			Math.min(startCoords.left, endCoords.left),
			Math.min(startCoords.top, endCoords.top),
			Math.abs(endCoords.right - startCoords.left),
			Math.max(startCoords.bottom, endCoords.bottom) - Math.min(startCoords.top, endCoords.top)
		);

		toolbarTippy?.setProps({ getReferenceClientRect: () => rect });
		toolbarTippy?.show();
	}

	function findNodePosition(target: ProseMirrorNode) {
		if (!editor) return null;

		let result: number | null = null;
		editor.state.doc.descendants((node, position) => {
			if (result !== null) return false;
			if (node === target) {
				result = position;
				return false;
			}
		});
		return result;
	}

	function renderBlockMenu(el: HTMLDivElement, editor: Editor, pos: number) {
		if (blockMenuInstance) unmount(blockMenuInstance);
		blockMenuInstance = mount(CommandMenu, {
			target: el,
			props: {
				items: COMMANDS,
				selectedIndex: blockMenuSelectedIndex,
				onSelect: (item: CommandItem) => {
					editor.chain().focus().setNodeSelection(pos).run();
					item.command(editor);
					blockMenuTippy?.hide();
				}
			}
		});
	}

	function openBlockMenu(handleEl: HTMLElement, editor: Editor) {
		if (!blockMenuNode || blockMenuPos === null) return;

		blockMenuSelectedIndex = 0;

		const el = document.createElement('div');
		renderBlockMenu(el, editor, blockMenuPos);

		blockMenuTippy?.destroy();
		blockMenuTippy = tippy(handleEl, {
			appendTo: () => document.body,
			content: el,
			interactive: true,
			trigger: 'manual',
			placement: 'bottom-start',
			onHidden(instance) {
				instance.destroy();
				if (blockMenuTippy === instance) blockMenuTippy = null;
				if (blockMenuInstance) {
					unmount(blockMenuInstance);
					blockMenuInstance = null;
				}
			}
		});

		blockMenuTippy.show();
	}

	function getDragHandleVirtualElement() {
		if (!editor || blockMenuPos === null) return null;

		const view = editor.view;
		const editorRect = view.dom.getBoundingClientRect();

		let nodeEl: HTMLElement | null = null;

		try {
			const dom = view.nodeDOM(blockMenuPos);
			if (dom instanceof HTMLElement) {
				nodeEl = dom;
			}
		} catch {
			nodeEl = null;
		}

		if (!nodeEl) return null;

		const nodeRect = nodeEl.getBoundingClientRect();

		const handleColumnX = Math.max(8, editorRect.left + 4);

		return {
			getBoundingClientRect: () => new DOMRect(handleColumnX, nodeRect.top, 1, nodeRect.height)
		};
	}

	function focusIsInsideToolbar() {
		const active = document.activeElement;
		if (!active) return false;
		return toolbarFloatEl?.contains(active) || toolbarTippy?.popper?.contains(active);
	}

	function closeToolbar() {
		toolbarResetToken++;
		toolbarTippy?.hide();
	}

	onMount(() => {
		const commandRenderer = buildCommandRenderer();

		editor = new Editor({
			element: editorEl,
			extensions: [
				StarterKit.configure({
					codeBlock: false,
					link: { openOnClick: false, enableClickSelection: true }
				}),
				Placeholder.configure({
					placeholder: ({ node }) => {
						if (node.type.name === 'heading') return 'Heading…';
						return placeholder;
					}
				}),
				Typography,
				TaskList,
				TaskItem.configure({ nested: true }),
				Image.configure({ allowBase64: true }),
				CodeBlockLowlight.configure({ lowlight }),
				DragHandle.configure({
					nested: true,
					getReferencedVirtualElement: getDragHandleVirtualElement,
					computePositionConfig: {
						strategy: 'fixed',
						placement: 'left'
					},

					onNodeChange: ({ node }) => {
						blockMenuNode = node;
						blockMenuPos = node ? findNodePosition(node) : null;
					},

					render: () => {
						const el = document.createElement('div');
						el.classList.add('drag-handle');

						mount(GripVertical, {
							target: el,
							props: { size: 20, strokeWidth: 1.5, color: 'currentColor' }
						});

						el.addEventListener('click', (e) => {
							e.stopPropagation();
							if (editor) openBlockMenu(el, editor);
						});

						return el;
					}
				}),
				createCommandsExtension(commandRenderer)
			],
			content,
			onTransaction: () => {
				version++;
				updateToolbar();
			},
			onUpdate: ({ editor }) => {
				onUpdate?.(editor.getJSON());
			}
		});

		if (toolbarFloatEl) {
			toolbarTippy = tippy(document.body, {
				content: toolbarFloatEl,
				trigger: 'manual',
				interactive: true,
				arrow: false,
				placement: 'top',
				offset: [0, 8],
				popperOptions: {
					modifiers: [
						{ name: 'flip', options: { fallbackPlacements: ['bottom'], padding: 8 } },
						{ name: 'preventOverflow', options: { padding: 8 } }
					]
				}
			});
		}
		editor.on('blur', () => {
			requestAnimationFrame(() => {
				if (toolbarIsEditingLink || focusIsInsideToolbar()) return;
				closeToolbar();
			});
		});
	});

	onDestroy(() => {
		editor?.destroy();
		commandTippy?.destroy();
		toolbarTippy?.destroy();
		if (commandInstance) unmount(commandInstance);
	});
</script>

<div class="relative w-full">
	<div bind:this={editorEl} class="editor-content"></div>

	<div bind:this={toolbarFloatEl}>
		{#if editor}
			<Toolbar
				{editor}
				{version}
				resetToken={toolbarResetToken}
				onEditingLinkChange={(editing) => {
					toolbarIsEditingLink = editing;
				}}
			/>
		{/if}
	</div>
</div>
