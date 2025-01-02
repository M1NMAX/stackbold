import Calendar from 'lucide-svelte/icons/calendar';
import SquareCheck from 'lucide-svelte/icons/square-check';
import Hash from 'lucide-svelte/icons/hash';
import Link from 'lucide-svelte/icons/link';
import List from 'lucide-svelte/icons/list';
import Text from 'lucide-svelte/icons/text';

export const INPUT_ICONS: { [idx: string]: any } = {
	text: Text,
	select: List,
	checkbox: SquareCheck,
	date: Calendar,
	number: Hash,
	url: Link
};
