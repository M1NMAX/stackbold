import { extractFilenameFromUrl } from '$lib/utils';
import Download from '@lucide/svelte/icons/download';
import Trash from '@lucide/svelte/icons/trash';
import Image, { type ImageOptions } from '@tiptap/extension-image';
import { mount, unmount } from 'svelte';

interface ImageWithDeleteOptions extends ImageOptions {
	onDownload: (key: string) => void;
	onDelete: (key: string) => void;
}

export const ImageWithDelete = Image.extend<ImageWithDeleteOptions>({
	addOptions() {
		return {
			...this.parent!(),
			onDownload: () => {},
			onDelete: () => {}
		};
	},

	addNodeView() {
		return ({ node, editor, getPos }) => {
			const dom = document.createElement('div');
			dom.className = 'img-wrapper';
			dom.style.position = 'relative';
			dom.style.display = 'inline-block';

			const img = document.createElement('img');
			img.src = node.attrs.src;
			img.alt = node.attrs.alt ?? '';
			dom.appendChild(img);

			const actions = document.createElement('div');
			actions.className = 'actions';

			const downloadBtn = document.createElement('button');
			const downloadInstace = mount(Download, { target: downloadBtn, props: {} });
			downloadBtn.classList.add('btn');

			downloadBtn.addEventListener('click', (e) => {
				this.options.onDownload(extractFilenameFromUrl(img.src, false));
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

				this.options.onDelete(extractFilenameFromUrl(img.src, false));
			});

			actions.append(downloadBtn, deleteBtn);
			dom.appendChild(actions);

			return {
				dom: dom,
				update(updatedNode) {
					if (updatedNode.type !== node.type) return false;
					img.src = updatedNode.attrs.src;
					img.alt = updatedNode.attrs.alt ?? '';
					return true;
				},
				destroy() {
					unmount(downloadInstace);
					unmount(deleteInstance);
				}
			};
		};
	}
});
