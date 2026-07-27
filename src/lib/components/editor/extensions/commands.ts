import type { Editor } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';
import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion';
import { MAX_FILE_SIZE } from '$lib/constant';

export interface CommandItem {
	icon: string;
	title: string;
	command: (editor: Editor) => void;
}

export type UploadResult = {
	filename: string;
	url: string;
	mimeType: string;
	size: number;
};

export type UploadHandler = (file: File) => Promise<UploadResult | null>;

export function createCommandList(uploadHandler: UploadHandler): CommandItem[] {
	return [
		{
			icon: 'text',
			title: 'Text',
			command: (editor) => editor.chain().focus().setParagraph().run()
		},
		{
			icon: 'heading1',
			title: 'Heading 1',
			command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()
		},
		{
			icon: 'heading2',
			title: 'Heading 2',
			command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()
		},
		{
			icon: 'heading3',
			title: 'Heading 3',
			command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()
		},
		{
			icon: 'bullet',
			title: 'Bullet List',
			command: (editor) => editor.chain().focus().toggleBulletList().run()
		},
		{
			icon: 'ordered',
			title: 'Numbered List',
			command: (editor) => editor.chain().focus().toggleOrderedList().run()
		},
		{
			icon: 'todo',
			title: 'To-do List',
			command: (editor) => editor.chain().focus().toggleTaskList().run()
		},
		{
			icon: 'quote',
			title: 'Quote',
			command: (editor) => editor.chain().focus().toggleBlockquote().run()
		},
		{
			icon: 'code',
			title: 'Code Block',
			command: (editor) => editor.chain().focus().toggleCodeBlock().run()
		},
		{
			icon: 'divider',
			title: 'Divider',
			command: (editor) => editor.chain().focus().setHorizontalRule().run()
		},
		{
			icon: 'image',
			title: 'Image',
			command: (editor) => triggerFileUpload(editor, true, uploadHandler)
		},
		{
			icon: 'attachment',
			title: 'Attachment',
			command: (editor) => triggerFileUpload(editor, false, uploadHandler)
		}
	];
}

export function filterCommands(commands: CommandItem[], query: string): CommandItem[] {
	const q = query.toLowerCase();
	return commands.filter((item) => item.title.toLowerCase().includes(q));
}

export type CommandRenderFactory = () => {
	onStart?: (props: SuggestionProps<CommandItem>) => void;
	onUpdate?: (props: SuggestionProps<CommandItem>) => void;
	onKeyDown?: (props: SuggestionKeyDownProps) => boolean;
	onExit?: () => void;
};

export function createCommandsExtension(
	renderFactory: CommandRenderFactory,
	commands: CommandItem[]
): Extension {
	return Extension.create({
		name: 'custom-commands',
		addProseMirrorPlugins() {
			return [
				Suggestion<CommandItem>({
					editor: this.editor,
					char: '/',
					command: ({ editor, range, props }) => {
						editor.chain().focus().deleteRange(range).run();
						props.command(editor);
					},
					items: ({ query }: { query: string }) => filterCommands(commands, query),
					render: renderFactory
				})
			];
		}
	});
}

export function isCommandItemActiveForNode(item: CommandItem, editor: Editor, position: number) {
	const resolvedPos = editor.state.doc.resolve(position);
	for (let depth = 1; depth <= resolvedPos.depth; depth++) {
		const result = matchByType(item, resolvedPos.node(depth));
		if (result !== null) return result;
	}
	const nodeAtPos = editor.state.doc.nodeAt(position);
	if (nodeAtPos) {
		const result = matchByType(item, nodeAtPos);
		if (result !== null) return result;
	}
	return false;
}

function matchByType(item: CommandItem, node: Node) {
	switch (node.type.name) {
		case 'heading':
			return item.icon === `heading${node.attrs.level}`;
		case 'bulletList':
			return item.icon === 'bullet';
		case 'orderedList':
			return item.icon === 'ordered';
		case 'taskList':
			return item.icon === 'todo';
		case 'blockquote':
			return item.icon === 'quote';
		case 'codeBlock':
			return item.icon === 'code';
		case 'horizontalRule':
			return item.icon === 'divider';
		case 'image':
			return item.icon === 'image';
		case 'paragraph':
			return item.icon === 'text';
		default:
			return null;
	}
}

function triggerFileUpload(editor: Editor, isImage: boolean, uploadHandler: UploadHandler) {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = isImage ? 'image/*' : '*/*';
	input.onchange = async () => {
		const file = input.files?.[0];
		if (!file) return;
		if (file.size >= MAX_FILE_SIZE) return;

		const result = await uploadHandler(file);
		if (!result) return;

		if (isImage) {
			editor.chain().focus().setImage({ src: result.url, alt: result.filename }).run();
		} else {
			editor.chain().focus().setAttachment(result).run();
		}
	};
	input.click();
}
