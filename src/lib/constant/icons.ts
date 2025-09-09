// Input
import Calendar from 'lucide-svelte/icons/calendar';
import SquareCheck from 'lucide-svelte/icons/square-check';
import SquareSlash from 'lucide-svelte/icons/square-slash';
import Hash from 'lucide-svelte/icons/hash';
import Link from 'lucide-svelte/icons/link';
import List from 'lucide-svelte/icons/list';
import Text from 'lucide-svelte/icons/text';
import Logs from 'lucide-svelte/icons/logs';
import CalendarClock from 'lucide-svelte/icons/calendar-clock';
import FolderSymlink from 'lucide-svelte/icons/folder-symlink';
import Combine from 'lucide-svelte/icons/combine';

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

// Collection
import Activity from 'lucide-svelte/icons/activity';
import AlarmClock from 'lucide-svelte/icons/alarm-clock';
import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
import Anchor from 'lucide-svelte/icons/anchor';
import Annoyed from 'lucide-svelte/icons/annoyed';
import Apple from 'lucide-svelte/icons/apple';
import Archive from 'lucide-svelte/icons/archive';
import Armchair from 'lucide-svelte/icons/armchair';
import Angry from 'lucide-svelte/icons/angry';
import Axe from 'lucide-svelte/icons/axe';
import Award from 'lucide-svelte/icons/award';
import Baby from 'lucide-svelte/icons/baby';
import Smile from 'lucide-svelte/icons/smile';
import Heart from 'lucide-svelte/icons/heart';
import Star from 'lucide-svelte/icons/star';
import Folder from 'lucide-svelte/icons/folder';
import Medal from 'lucide-svelte/icons/medal';
import Backpack from 'lucide-svelte/icons/backpack';
import Banana from 'lucide-svelte/icons/banana';
import CalendarDays from 'lucide-svelte/icons/calendar-days';
import ListTodo from 'lucide-svelte/icons/list-todo';
import BookOpenCheck from 'lucide-svelte/icons/book-open-check';
import Clapperboard from 'lucide-svelte/icons/clapperboard';
import Film from 'lucide-svelte/icons/film';
import Banknote from 'lucide-svelte/icons/banknote';
import Landmark from 'lucide-svelte/icons/landmark';
import Gem from 'lucide-svelte/icons/gem';
import Wallet from 'lucide-svelte/icons/wallet';

//views

import Kanban from 'lucide-svelte/icons/kanban';
import StretchHorizontal from 'lucide-svelte/icons/stretch-horizontal';
import Table from 'lucide-svelte/icons/table';
// Others
import File from 'lucide-svelte/icons/file';

type IconBundle = {
	[idx: string]: any;
};

export const INPUT_ICONS: IconBundle = {
	none: SquareSlash,
	text: Text,
	select: List,
	multiselect: Logs,
	checkbox: SquareCheck,
	date: Calendar,
	number: Hash,
	url: Link,
	created: CalendarClock,
	relation: FolderSymlink,
	bundle: Combine
};

export const THEME_ICONS: IconBundle = {
	light: SunDim,
	dark: Moon,
	system: SunMoon
};

export const SORT_ICONS: IconBundle = {
	'name-asc': ArrowDownAZ,
	'name-desc': ArrowDownZA,
	'updatedAt-asc': ClockArrowDown,
	'updatedAt-desc': ClockArrowUp,
	'createdAt-asc': CalendarArrowDown,
	'createdAt-desc': CalendarArrowUp
};

export const COLLECTION_ICONS: IconBundle = {
	activity: Activity,
	alarm: AlarmClock,
	alert: AlertTriangle,
	anchor: Anchor,
	annoyed: Annoyed,
	apple: Apple,
	archive: Archive,
	armchair: Armchair,
	angry: Angry,
	award: Award,
	axe: Axe,
	baby: Baby,
	banana: Banana,

	calendar: CalendarDays,
	todo: ListTodo,
	smile: Smile,
	folder: Folder,
	heart: Heart,
	star: Star,
	medal: Medal,
	backpack: Backpack,
	taskBook: BookOpenCheck,
	clapperboard: Clapperboard,
	film: Film,
	backnote: Banknote,
	landmark: Landmark,
	gem: Gem,
	wallet: Wallet
};

export const VIEW_ICONS: IconBundle = {
	list: StretchHorizontal,
	table: Table,
	board: Kanban
};

export const OTHERS_ICONS: IconBundle = {
	item: File
};

export const APP_ICONS = {
	...INPUT_ICONS,
	...THEME_ICONS,
	...SORT_ICONS,
	...COLLECTION_ICONS,
	...VIEW_ICONS,
	...OTHERS_ICONS
};
