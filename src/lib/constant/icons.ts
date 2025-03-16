import Calendar from 'lucide-svelte/icons/calendar';
import SquareCheck from 'lucide-svelte/icons/square-check';
import SquareSlash from 'lucide-svelte/icons/square-slash';
import Hash from 'lucide-svelte/icons/hash';
import Link from 'lucide-svelte/icons/link';
import List from 'lucide-svelte/icons/list';
import Text from 'lucide-svelte/icons/text';

// Theme
import Moon from 'lucide-svelte/icons/moon';
import SunDim from 'lucide-svelte/icons/sun-dim';
import SunMoon from 'lucide-svelte/icons/sun-moon';

export const INPUT_ICONS: { [idx: string]: any } = {
	none: SquareSlash,
	text: Text,
	select: List,
	checkbox: SquareCheck,
	date: Calendar,
	number: Hash,
	url: Link
};

export const THEME_ICONS: { [idx: string]: any } = {
	light: SunDim,
	dark: Moon,
	system: SunMoon
};

export const APP_ICONS = { ...INPUT_ICONS, ...THEME_ICONS };
