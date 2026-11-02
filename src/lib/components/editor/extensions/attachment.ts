import Download from '@lucide/svelte/icons/download';
import Trash from '@lucide/svelte/icons/trash';
import { Node, mergeAttributes } from '@tiptap/core';
import { mount, unmount } from 'svelte';
import { FILE_ICONS } from '$lib/constant/index.js';
import { extractFilenameFromUrl, getIconKey } from '$lib/utils/index.js';

export interface AttachmentOptions {
	HTMLAttributes: Record<string, any>;
	onDownload: (key: string) => void;
	onDelete: (key: string) => void;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		attachment: {
			setAttachment: (attrs: {
				url: string;
				filename: string;
				mimeType?: string;
				size?: number;
			}) => ReturnType;
		};
	}
}

export const Attachment = Node.create<AttachmentOptions>({
	name: 'attachment',
	group: 'block',
	atom: true,
	draggable: true,

	addOptions() {
		return { HTMLAttributes: {}, onDownload: () => {}, onDelete: () => {} };
	},

	addAttributes() {
		return {
			url: { default: null },
			filename: { default: 'file' },
			mimeType: { default: null },
			size: { default: null }
		};
	},

	parseHTML() {
		return [{ tag: 'div[data-type="attachment"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			'div',
			mergeAttributes({ 'data-type': 'attachment' }, this.options.HTMLAttributes, HTMLAttributes)
		];
	},

	addNodeView() {
		return ({ node, editor, getPos }) => {
			const dom = document.createElement('div');
			dom.setAttribute('data-type', 'attachment');
			dom.className = 'attachment';

			const icon = document.createElement('span');
			mount(FILE_ICONS[getIconKey(node.attrs.filename)], {
				target: icon,
				props: { size: 26, strokeWidth: 1.5, color: 'currentColor' }
			});

			const infos = document.createElement('div');
			infos.className = 'infos';

			const name = document.createElement('span');
			name.textContent = node.attrs.filename;
			name.className = 'name';

			const meta = document.createElement('span');

			if (node.attrs.size) {
				meta.textContent = `${Math.ceil(node.attrs.size / 1024)} KB`;
				meta.className = 'meta';
			}

			const actions = document.createElement('div');
			actions.className = 'actions';

			const downloadBtn = document.createElement('button');
			const downloadInstace = mount(Download, { target: downloadBtn, props: {} });
			downloadBtn.classList.add('btn');

			downloadBtn.addEventListener('click', (e) => {
				this.options.onDownload(extractFilenameFromUrl(node.attrs.url, false));
			});
			const deleteBtn = document.createElement('button');
			const deleteInstance = mount(Trash, { target: deleteBtn, props: {} });
			deleteBtn.classList.add('btn', 'danger');

			deleteBtn.addEventListener('click', (e) => {
				e.preventDefault();
				if (typeof getPos !== 'function') return;
				const pos = getPos();
				if (!pos) return;
				editor
					.chain()
					.focus()
					.deleteRange({ from: pos, to: pos + node.nodeSize })
					.run();

				this.options.onDelete(extractFilenameFromUrl(node.attrs.url, false));
			});

			actions.append(downloadBtn, deleteBtn);

			infos.append(name, meta);
			dom.append(icon, infos, actions);
			return {
				dom,
				destroy() {
					unmount(downloadInstace);
					unmount(deleteInstance);
				}
			};
		};
	},

	addCommands() {
		return {
			setAttachment:
				(attrs) =>
				({ commands }) =>
					commands.insertContent({ type: this.name, attrs })
		};
	}
});
