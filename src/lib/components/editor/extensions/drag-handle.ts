/**
 * Drag-handle extension — full-line hover detection.
 *
 * Instead of relying on the handle element's own hover area (which creates
 * a dead-zone gap), we track pointer position on the *document* level and
 * hit-test against each top-level block's bounding rect. This means the
 * handle stays visible whenever the cursor is anywhere on the same line as
 * a block, not just over the tiny grip icon.
 */
import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Node as PmNode } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';

const pluginKey = new PluginKey('dragHandle');

function createHandle(): HTMLElement {
	const el = document.createElement('div');
	el.setAttribute('draggable', 'true');
	el.setAttribute('contenteditable', 'false');

	Object.assign(el.style, {
		position: 'absolute',
		display: 'none',
		alignItems: 'center',
		justifyContent: 'center',
		// Full line height so the hover zone matches the block
		width: '24px',
		cursor: 'grab',
		borderRadius: '4px',
		userSelect: 'none',
		zIndex: '10',
		transition: 'opacity 0.1s'
	});

	el.innerHTML = `<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" style="color:#9ca3af;pointer-events:none;display:block">
	   <circle cx="2" cy="2" r="1.5"/>
	   <circle cx="8" cy="2" r="1.5"/>
	   <circle cx="2" cy="8" r="1.5"/>
	   <circle cx="8" cy="8" r="1.5"/>
	   <circle cx="2" cy="14" r="1.5"/>
	   <circle cx="8" cy="14" r="1.5"/>
	 </svg>`;

	return el;
}

export function createDragHandleExtension(): Extension {
	return Extension.create({
		name: 'dragHandle',

		addProseMirrorPlugins() {
			const editor: Editor = this.editor;
			let handle: HTMLElement | null = null;
			let dragSourcePos: number | null = null;
			let currentNodePos: number | null = null;
			let isDragging = false;
			let view: EditorView | null = null;

			// ── Pointer tracking on document ──────────────────────────────────────
			// We listen on `document` instead of the editor DOM so the pointer
			// moving onto the handle element itself never causes a gap.
			function onPointerMove(event: PointerEvent) {
				if (!handle || !view || isDragging) return;

				const editorDom = view.dom;
				const editorRect = editorDom.getBoundingClientRect();

				// Only act when the pointer is horizontally within the editor's page area
				// (including a generous gutter to the left for the handle itself)
				const GUTTER = 20; // px to the left of editor where handle lives
				if (
					event.clientX < editorRect.left - GUTTER ||
					event.clientX > editorRect.right ||
					event.clientY < editorRect.top ||
					event.clientY > editorRect.bottom
				) {
					hideHandle();
					return;
				}

				// Ask ProseMirror which position the pointer is closest to
				const pos = view.posAtCoords({
					left: Math.max(event.clientX, editorRect.left + 1),
					top: event.clientY
				});
				if (!pos) {
					hideHandle();
					return;
				}

				const $pos = view.state.doc.resolve(pos.pos);
				let depth = $pos.depth;
				while (depth > 1) depth--;
				const nodePos = $pos.before(depth + 1);
				const node: PmNode | null = view.state.doc.nodeAt(nodePos);
				if (!node) {
					hideHandle();
					return;
				}

				showHandle(view, nodePos);
			}

			function onPointerLeave(event: PointerEvent) {
				// Only hide if the pointer left the browser window entirely
				if (event.clientX <= 0 || event.clientY <= 0) hideHandle();
			}

			function showHandle(v: EditorView, nodePos: number) {
				if (!handle) return;
				currentNodePos = nodePos;

				const domNode = v.nodeDOM(nodePos) as HTMLElement | null;
				if (!domNode) return;

				const parent = handle.parentElement!;
				const parentRect = parent.getBoundingClientRect();
				const nodeRect = domNode.getBoundingClientRect();
				const editorRect = v.dom.getBoundingClientRect();

				const top = nodeRect.top - parentRect.top + parent.scrollTop;
				const height = nodeRect.height;
				const left = editorRect.left - parentRect.left - 20;

				handle.style.top = `${top}px`;
				handle.style.left = `${left}px`;
				handle.style.height = `${height}px`;
				handle.style.display = 'flex';
			}

			function hideHandle() {
				if (handle && !isDragging) handle.style.display = 'none';
			}

			return [
				new Plugin({
					key: pluginKey,

					view(v: EditorView) {
						view = v;
						handle = createHandle();

						handle.addEventListener('dragstart', (e) => {
							if (currentNodePos === null) return;
							isDragging = true;
							dragSourcePos = currentNodePos;
							if (e.dataTransfer) {
								e.dataTransfer.effectAllowed = 'move';
								e.dataTransfer.setData('text/plain', String(currentNodePos));
							}
							handle!.style.cursor = 'grabbing';
							handle!.style.opacity = '0.4';
						});

						handle.addEventListener('dragend', () => {
							isDragging = false;
							dragSourcePos = null;
							if (handle) {
								handle.style.cursor = 'grab';
								handle.style.opacity = '1';
								handle.style.display = 'none';
							}
						});

						// Document-level pointer tracking — no dead zones
						document.addEventListener('pointermove', onPointerMove);
						document.addEventListener('pointerleave', onPointerLeave);

						const parent = v.dom.parentElement;
						if (parent) {
							const cs = window.getComputedStyle(parent);
							if (cs.position === 'static') parent.style.position = 'relative';
							parent.appendChild(handle);
						}

						return {
							destroy() {
								document.removeEventListener('pointermove', onPointerMove);
								document.removeEventListener('pointerleave', onPointerLeave);
								handle?.remove();
								handle = null;
								view = null;
							}
						};
					},

					props: {
						handleDOMEvents: {
							drop(v: EditorView, event: DragEvent) {
								if (dragSourcePos === null) return false;
								event.preventDefault();

								const dropPos = v.posAtCoords({
									left: event.clientX,
									top: event.clientY
								});
								if (!dropPos) return false;

								const { tr, doc } = v.state;
								const srcNode = doc.nodeAt(dragSourcePos);
								if (!srcNode) return false;

								const nodeSize = srcNode.nodeSize;
								let targetPos = dropPos.pos;
								if (targetPos > dragSourcePos) targetPos -= nodeSize;

								v.dispatch(
									tr.delete(dragSourcePos, dragSourcePos + nodeSize).insert(targetPos, srcNode)
								);
								editor.commands.focus();
								return true;
							}
						}
					}
				})
			];
		}
	});
}
