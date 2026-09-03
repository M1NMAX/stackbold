import { mount, unmount } from 'svelte';
import { ItemEmbed } from '../index.js';
import { Node } from '@tiptap/core';
import { noop } from '$lib/utils/index.js';

export interface ItemOptions {
	HTMLAttributes: Record<string, any>;
	context: Map<any, any>;
	onClickItem: (id: string) => void;
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
	addStorage() {
		return {
			pendingAutofocusId: null as string | null
		};
	},
	addOptions() {
		return {
			HTMLAttributes: {},
			context: new Map(),
			onClickItem: noop
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
	addNodeView() {
		return ({ node }) => {
			const dom = document.createElement('div');
			dom.dataset.itemEmbed = '';
			dom.contentEditable = 'false';

			const autofocus = !!node.attrs.id && node.attrs.id === this.storage.pendingAutofocusId;
			if (autofocus) {
				this.storage.pendingAutofocusId = null;
			}
			const instance = mount(ItemEmbed, {
				target: dom,
				context: this.options.context,
				props: {
					get id() {
						return node.attrs.id;
					},
					autofocus,
					onClickItem: this.options.onClickItem
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
