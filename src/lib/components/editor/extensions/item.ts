import { mount, unmount } from 'svelte';
import { ItemEmbed } from '../index.js';
import { Editor, Node } from '@tiptap/core';
import { noop } from '$lib/utils/index.js';
import { NodeSelection, Selection } from '@tiptap/pm/state';

export interface ItemOptions {
	HTMLAttributes: Record<string, any>;
	context: Map<any, any>;
	onClickItem: (id: string) => void;
	createItem: () => Promise<string | null>;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		item: {
			setItem: (attrs: { id: string }) => ReturnType;
		};
	}
}

export const ItemEmbedNode = Node.create<ItemOptions>({
	name: 'itemEmbed',
	group: 'block',
	atom: true,
	selectable: true,

	addStorage() {
		return {
			pendingAutofocusId: null as string | null
		};
	},
	addOptions() {
		return {
			HTMLAttributes: {},
			context: new Map(),
			onClickItem: noop,
			createItem: async () => null
		};
	},

	addAttributes() {
		return { id: { default: null } };
	},
	parseHTML() {
		return [{ tag: 'div[data-item-embed]' }];
	},
	renderHTML({ node }) {
		return ['div', { 'data-item-embed': '', 'data-item-id': node.attrs.id }];
	},

	addKeyboardShortcuts() {
		const tryEnter = (dir: 'up' | 'down' | 'left' | 'right') => {
			const { editor } = this;
			const { state, view } = editor;
			const { selection } = state;

			if (!selection.empty || selection instanceof NodeSelection) return false;
			if (!view.endOfTextblock(dir)) return false;

			const { $from } = selection;
			const goingBack = dir === 'up' || dir === 'left';

			if (goingBack) {
				const before = $from.before($from.depth);
				const nodeBefore = state.doc.resolve(before).nodeBefore;
				if (nodeBefore?.type.name !== this.name) return false;
				return focusOnNameInput(editor, before - nodeBefore.nodeSize, false);
			} else {
				const after = $from.after($from.depth);
				const nodeAfter = state.doc.resolve(after).nodeAfter;
				if (nodeAfter?.type.name !== this.name) return false;
				return focusOnNameInput(editor, after, true);
			}
		};

		const onBackspace = () => {
			const { editor } = this;
			const { selection, doc } = editor.state;
			if (!selection.empty || selection instanceof NodeSelection) return false;

			const { $from } = selection;
			if ($from.parentOffset !== 0) return false;

			const before = $from.before($from.depth);
			const nodeBefore = doc.resolve(before).nodeBefore;
			if (nodeBefore?.type.name !== this.name) return false;

			const itemPos = before - nodeBefore.nodeSize;

			if ($from.parent.content.size === 0) {
				editor.commands.deleteRange({ from: before, to: $from.after($from.depth) });
			}
			return focusOnNameInput(editor, itemPos, false);
		};

		const onDelete = () => {
			const { editor } = this;
			const { selection, doc } = editor.state;
			if (!selection.empty || selection instanceof NodeSelection) return false;

			const { $from } = selection;
			if ($from.parentOffset !== $from.parent.content.size) return false;

			const after = $from.after($from.depth);
			const nodeAfter = doc.resolve(after).nodeAfter;
			if (nodeAfter?.type.name !== this.name) return false;

			return focusOnNameInput(editor, after, true);
		};

		return {
			ArrowUp: () => tryEnter('up'),
			ArrowDown: () => tryEnter('down'),
			ArrowLeft: () => tryEnter('left'),
			ArrowRight: () => tryEnter('right'),
			Backspace: () => onBackspace(),
			Delete: () => onDelete()
		};
	},

	addNodeView() {
		return ({ node, getPos, editor }) => {
			const dom = document.createElement('div');
			dom.dataset.itemEmbed = '';
			dom.contentEditable = 'false';

			const autofocus = !!node.attrs.id && node.attrs.id === this.storage.pendingAutofocusId;
			if (autofocus) this.storage.pendingAutofocusId = null;

			const exitToEditor = (direction: 'up' | 'down' | 'left' | 'right') => {
				const pos = getPos();
				if (typeof pos !== 'number') return;

				const goingBack = direction === 'up' || direction === 'left';
				const doc = editor.state.doc;

				if (goingBack) {
					if (pos === 0) return;
					const nodeBefore = doc.resolve(pos).nodeBefore;
					if (nodeBefore?.type.name === this.name) {
						focusOnNameInput(editor, pos - nodeBefore.nodeSize, false);
						return;
					}
					focusEditorFrom(editor, pos, -1);
				} else {
					const afterPos = pos + node.nodeSize;
					const nodeAfter = doc.resolve(afterPos).nodeAfter;
					if (nodeAfter?.type.name === this.name) {
						focusOnNameInput(editor, afterPos, true);
						return;
					}
					focusEditorFrom(editor, afterPos, 1);
				}
			};

			const deleteSelf = () => {
				const pos = getPos();
				if (typeof pos !== 'number') return;

				editor
					.chain()
					.deleteRange({ from: pos, to: pos + node.nodeSize })
					.run();

				const nodeBefore = pos > 0 ? editor.state.doc.resolve(pos).nodeBefore : null;
				if (nodeBefore?.type.name === this.name) {
					focusOnNameInput(editor, pos - nodeBefore.nodeSize, false);
					return;
				}
				if (!focusEditorFrom(editor, pos, -1)) focusEditorFrom(editor, pos, 1);
			};

			const insertItemBelow = async () => {
				const newId = await this.options.createItem();
				if (!newId) return;

				const pos = getPos();
				if (typeof pos !== 'number') return;

				this.storage.pendingAutofocusId = newId;
				editor
					.chain()
					.insertContentAt(pos + node.nodeSize, { type: this.name, attrs: { id: newId } })
					.run();
			};

			const instance = mount(ItemEmbed, {
				target: dom,
				context: this.options.context,
				props: {
					get id() {
						return node.attrs.id;
					},
					autofocus,
					onClickItem: this.options.onClickItem,
					onExit: exitToEditor,
					onEnter: insertItemBelow,
					onDelete: deleteSelf
				}
			});

			return {
				dom,
				stopEvent: () => true,
				ignoreMutation: () => true,
				destroy() {
					unmount(instance);
				}
			};
		};
	},

	addCommands() {
		return {
			setItem:
				(attrs) =>
				({ commands }) => {
					this.storage.pendingAutofocusId = attrs.id;
					return commands.insertContent({ type: this.name, attrs });
				}
		};
	}
});

function focusOnNameInput(editor: Editor, pos: number, atStart: boolean) {
	const targetDom = editor.view.nodeDOM(pos) as HTMLElement | null;
	const input = targetDom?.querySelector<HTMLInputElement>('input[data-item-name-input]');
	if (!input) return false;
	input.focus();
	const caret = atStart ? 0 : input.value.length;
	input.setSelectionRange(caret, caret);
	return true;
}

function focusEditorFrom(editor: Editor, pos: number, dir: 1 | -1) {
	const { state, view } = editor;
	const sel = Selection.findFrom(state.doc.resolve(pos), dir, true);
	if (!sel) return false;
	view.dispatch(state.tr.setSelection(sel).scrollIntoView());
	view.focus();
	return true;
}
