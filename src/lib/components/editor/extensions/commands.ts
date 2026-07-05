import type { Editor } from '@tiptap/core';
import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion';

export interface CommandItem {
	icon: string;
	title: string;
	command: (editor: Editor) => void;
}

export const COMMANDS: CommandItem[] = [
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
		title: 'Quote',
		icon: 'quote',
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
		command: (editor) => {
			const url = window.prompt('Image URL');
			if (url) {
				editor.chain().focus().setImage({ src: url }).run();
			}
		}
	}
];

export function filterCommands(query: string): CommandItem[] {
	const q = query.toLowerCase();
	return COMMANDS.filter((item) => item.title.toLowerCase().includes(q));
}

export type CommandRenderFactory = () => {
	onStart?: (props: SuggestionProps<CommandItem>) => void;
	onUpdate?: (props: SuggestionProps<CommandItem>) => void;
	onKeyDown?: (props: SuggestionKeyDownProps) => boolean;
	onExit?: () => void;
};

export function createCommandsExtension(renderFactory: CommandRenderFactory): Extension {
	return Extension.create({
		name: 'custom-commands',
		addProseMirrorPlugins() {
			return [
				Suggestion<CommandItem>({
					editor: this.editor,
					char: '/',
					command: ({
						editor,
						range,
						props
					}: {
						editor: Editor;
						range: { from: number; to: number };
						props: CommandItem;
					}) => {
						editor.chain().focus().deleteRange(range).run();
						props.command(editor);
					},
					items: ({ query }: { query: string }) => filterCommands(query),
					render: renderFactory
				})
			];
		}
	});
}
