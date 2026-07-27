<script lang="ts">
	import { onMount, onDestroy, mount, unmount } from 'svelte';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import { Editor, type JSONContent } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import Typography from '@tiptap/extension-typography';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '@tiptap/extension-task-item';
	import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
	import DragHandle from '@tiptap/extension-drag-handle';
	import { createLowlight, common } from 'lowlight';
	import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
	import { NodeSelection } from '@tiptap/pm/state';
	import tippy, { type Instance as TippyInstance } from 'tippy.js';
	import { CommandMenu, Toolbar } from './index.js';
	import {
		Attachment,
		ImageWithDelete,
		createCommandsExtension,
		isCommandItemActiveForNode,
		type CommandItem,
		type CommandRenderFactory,
		createCommandList,
		type UploadResult
	} from './extensions/index.js';

	type CommandMenuProps = {
		items: CommandItem[];
		selectedIndex: number;
		onSelect: (item: CommandItem) => void;
		onMouseEnter: (index: number) => void;
		isItemActive?: (item: CommandItem) => boolean;
	};

	type MenuOpenOptions = {
		anchorEl?: Element;
		items: CommandItem[];
		getReferenceClientRect: () => DOMRect;
		isItemActive?: (item: CommandItem) => boolean;
		onSelect: (item: CommandItem) => void;
		onShow?: () => void;
		onHidden?: () => void;
	};

	type Props = {
		content?: string | JSONContent;
		onUpdate: (content: JSONContent) => void;
		onUploadFile: (file: File) => Promise<UploadResult | null>;
		onDownloadFile: (key: string) => void;
		onDeleteFile: (key: string) => void;
	};

	let {
		content = $bindable(''),
		onUpdate,
		onUploadFile,
		onDownloadFile,
		onDeleteFile
	}: Props = $props();

	const PLACEHOLDER = "Write, type '/' for commands…";
	const COMMANDS = createCommandList((() => onUploadFile)());
	const lowlight = createLowlight(common);

	let version = $state(0);
	let editor = $state<Editor | null>(null);
	let editorEl: HTMLDivElement;

	let toolbarFloatEl = $state<HTMLDivElement | null>(null);
	let toolbarTippy: TippyInstance | null = null;
	let toolbarIsEditingLink = $state(false);
	let toolbarResetToken = $state(0);

	type MenuController = ReturnType<typeof createMenuController>;

	let slashMenu: MenuController;
	let blockMenu: MenuController;

	let blockMenuNode: ProseMirrorNode | null = null;
	let blockMenuPosition: number | null = null;

	function createMenuController() {
		let tippyInstance: TippyInstance | null = null;
		let instance: ReturnType<typeof mount> | null = null;
		let props = $state<CommandMenuProps | null>(null);
		let hiddenCb: (() => void) | null = null;
		let currentOnSelect: ((item: CommandItem) => void) | null = null;

		function destroy() {
			if (tippyInstance) {
				const t = tippyInstance;
				tippyInstance = null; // prevent re-entrant destroy from onHidden
				t.destroy();
			}
			if (instance) {
				unmount(instance);
				instance = null;
			}
			props = null;
			hiddenCb = null;
			currentOnSelect = null;
		}

		function moveSelection(delta: number) {
			if (!props) return;
			const count = props.items.length || 1;
			props.selectedIndex = (props.selectedIndex + delta + count) % count;
		}

		function selectCurrent() {
			if (!props) return;
			const item = props.items[props.selectedIndex];
			if (item) props.onSelect(item);
		}

		return {
			get isOpen() {
				return props !== null;
			},

			open(opts: MenuOpenOptions) {
				destroy();

				hiddenCb = opts.onHidden ?? null;
				currentOnSelect = opts.onSelect;

				props = {
					items: opts.items,
					selectedIndex: 0,
					onSelect: (item: CommandItem) => {
						currentOnSelect?.(item);
						tippyInstance?.hide();
					},
					onMouseEnter: (index: number) => {
						if (props) props.selectedIndex = index;
					},
					...(opts.isItemActive ? { isItemActive: opts.isItemActive } : {})
				};

				const el = document.createElement('div');
				instance = mount(CommandMenu, { target: el, props });

				tippyInstance = tippy(opts.anchorEl ?? document.body, {
					getReferenceClientRect: opts.getReferenceClientRect,
					appendTo: () => document.body,
					content: el,
					showOnCreate: true,
					interactive: true,
					arrow: false,
					trigger: 'manual',
					placement: 'bottom-start',
					onShow: () => opts.onShow?.(),
					onHidden: () => {
						const cb = hiddenCb;
						destroy();
						cb?.();
					}
				});
			},

			updateItems(items: CommandItem[]) {
				if (props) {
					props.items = items;
					props.selectedIndex = 0;
				}
			},

			updateOnSelect(onSelect: (item: CommandItem) => void) {
				currentOnSelect = onSelect;
			},

			updateReference(getReferenceClientRect: () => DOMRect) {
				tippyInstance?.setProps({ getReferenceClientRect });
			},

			handleKeyDown(event: KeyboardEvent) {
				if (!props) return false;

				if (event.key === 'Escape' || event.key === 'Tab') {
					tippyInstance?.hide();
					return true;
				}
				if (event.key === 'ArrowDown') {
					moveSelection(1);
					return true;
				}
				if (event.key === 'ArrowUp') {
					moveSelection(-1);
					return true;
				}
				if (event.key === 'Enter') {
					selectCurrent();
					tippyInstance?.hide();
					return true;
				}
				return false;
			},

			hide() {
				tippyInstance?.hide();
			},

			destroy
		};
	}

	function buildCommandRenderer(): CommandRenderFactory {
		return () => {
			return {
				onStart(props) {
					slashMenu.open({
						items: props.items,
						getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
						onSelect: (item) => props.command(item)
					});
				},

				onUpdate(props) {
					slashMenu.updateItems(props.items);
					slashMenu.updateReference(() => props.clientRect?.() ?? new DOMRect());
					slashMenu.updateOnSelect((item) => props.command(item));
				},

				onKeyDown({ event }) {
					return slashMenu.handleKeyDown(event);
				},

				onExit() {
					slashMenu.destroy();
				}
			};
		};
	}

	function handleBlockMenuKeyDown(e: KeyboardEvent) {
		if (blockMenu.handleKeyDown(e)) {
			e.preventDefault();
		}
	}

	function openBlockMenu(handleEl: HTMLElement, editorInstance: Editor) {
		if (!blockMenuNode || blockMenuPosition === null) return;

		const pos = blockMenuPosition;

		blockMenu.open({
			anchorEl: handleEl,
			items: COMMANDS,
			getReferenceClientRect: () => handleEl.getBoundingClientRect(),
			isItemActive: (item) => isCommandItemActiveForNode(item, editorInstance, pos),
			onSelect: (item) => {
				editorInstance.chain().focus().setNodeSelection(pos).run();
				item.command(editorInstance);
			},
			onShow: () => {
				document.addEventListener('keydown', handleBlockMenuKeyDown, true);
			},
			onHidden: () => {
				document.removeEventListener('keydown', handleBlockMenuKeyDown, true);
			}
		});
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

	function getDragHandleVirtualElement() {
		if (!editor || blockMenuPosition === null) return null;

		const view = editor.view;
		const editorRect = view.dom.getBoundingClientRect();

		let nodeEl: HTMLElement | null = null;

		try {
			const dom = view.nodeDOM(blockMenuPosition);
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
		slashMenu = createMenuController();
		blockMenu = createMenuController();

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
						return PLACEHOLDER;
					}
				}),
				Typography,
				TaskList,
				TaskItem.configure({ nested: true }),
				CodeBlockLowlight.configure({ lowlight }),
				Attachment.configure({ onDownload: onDownloadFile, onDelete: onDeleteFile }),
				ImageWithDelete.configure({
					allowBase64: true,
					onDownload: onDownloadFile,
					onDelete: onDeleteFile
				}),
				createCommandsExtension(commandRenderer, COMMANDS),
				DragHandle.configure({
					nested: true,
					getReferencedVirtualElement: getDragHandleVirtualElement,
					computePositionConfig: {
						strategy: 'fixed',
						placement: 'left'
					},

					onNodeChange: ({ node }) => {
						blockMenuNode = node;
						blockMenuPosition = node ? findNodePosition(node) : null;
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
				})
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
		slashMenu?.destroy();
		blockMenu?.destroy();
		toolbarTippy?.destroy();
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
