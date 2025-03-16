// Input
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

// Sort
import ArrowDownAZ from 'lucide-svelte/icons/arrow-down-az';
import ArrowDownZA from 'lucide-svelte/icons/arrow-down-za';
import CalendarArrowDown from 'lucide-svelte/icons/calendar-arrow-down';
import CalendarArrowUp from 'lucide-svelte/icons/calendar-arrow-up';
import ClockArrowDown from 'lucide-svelte/icons/clock-arrow-down';
import ClockArrowUp from 'lucide-svelte/icons/clock-arrow-up';

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

export const SORT_ICONS: { [idx: string]: any } = {
	'name-asc': ArrowDownAZ,
	'name-desc': ArrowDownZA,
	'updatedAt-asc': ClockArrowDown,
	'updatedAt-desc': ClockArrowUp,
	'createdAt-asc': CalendarArrowDown,
	'createdAt-desc': CalendarArrowUp
};

export const APP_ICONS = { ...INPUT_ICONS, ...THEME_ICONS, ...SORT_ICONS };
