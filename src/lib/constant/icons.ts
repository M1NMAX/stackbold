// Input
import Calendar from '@lucide/svelte/icons/calendar';
import SquareCheck from '@lucide/svelte/icons/square-check';
import SquareSlash from '@lucide/svelte/icons/square-slash';
import Hash from '@lucide/svelte/icons/hash';
import Link from '@lucide/svelte/icons/link';
import List from '@lucide/svelte/icons/list';
import Text from '@lucide/svelte/icons/text';
import Logs from '@lucide/svelte/icons/logs';
import CalendarClock from '@lucide/svelte/icons/calendar-clock';
import FolderSymlink from '@lucide/svelte/icons/folder-symlink';
import Combine from '@lucide/svelte/icons/combine';
import Paperclip from '@lucide/svelte/icons/paperclip';

// Theme
import Moon from '@lucide/svelte/icons/moon';
import SunDim from '@lucide/svelte/icons/sun-dim';
import SunMoon from '@lucide/svelte/icons/sun-moon';

// Sort
import ArrowDownAZ from '@lucide/svelte/icons/arrow-down-az';
import ArrowDownZA from '@lucide/svelte/icons/arrow-down-za';
import CalendarArrowDown from '@lucide/svelte/icons/calendar-arrow-down';
import CalendarArrowUp from '@lucide/svelte/icons/calendar-arrow-up';
import ClockArrowDown from '@lucide/svelte/icons/clock-arrow-down';
import ClockArrowUp from '@lucide/svelte/icons/clock-arrow-up';

// Collection
import AlarmClock from '@lucide/svelte/icons/alarm-clock';
import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
import Anchor from '@lucide/svelte/icons/anchor';
import Angry from '@lucide/svelte/icons/angry';
import Annoyed from '@lucide/svelte/icons/annoyed';
import Apple from '@lucide/svelte/icons/apple';
import Archive from '@lucide/svelte/icons/archive';
import Armchair from '@lucide/svelte/icons/armchair';
import Award from '@lucide/svelte/icons/award';
import Axe from '@lucide/svelte/icons/axe';
import Baby from '@lucide/svelte/icons/baby';
import Backpack from '@lucide/svelte/icons/backpack';
import Banana from '@lucide/svelte/icons/banana';
import Banknote from '@lucide/svelte/icons/banknote';
import BookOpen from '@lucide/svelte/icons/book-open';
import BookOpenCheck from '@lucide/svelte/icons/book-open-check';
import CalendarDays from '@lucide/svelte/icons/calendar-days';
import Clapperboard from '@lucide/svelte/icons/clapperboard';
import Film from '@lucide/svelte/icons/film';
import Flag from '@lucide/svelte/icons/flag';
import Folder from '@lucide/svelte/icons/folder';
import Gem from '@lucide/svelte/icons/gem';
import Gift from '@lucide/svelte/icons/gift';
import Heart from '@lucide/svelte/icons/heart';
import Landmark from '@lucide/svelte/icons/landmark';
import Link2 from '@lucide/svelte/icons/link-2';
import Medal from '@lucide/svelte/icons/medal';
import Repeat from '@lucide/svelte/icons/repeat';
import Scale from '@lucide/svelte/icons/scale';
import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
import Smile from '@lucide/svelte/icons/smile';
import SquareCheckBig from '@lucide/svelte/icons/square-check-big';
import Wallet from '@lucide/svelte/icons/wallet';
import Workflow from '@lucide/svelte/icons/workflow';

//views
import Kanban from '@lucide/svelte/icons/kanban';
import StretchHorizontal from '@lucide/svelte/icons/stretch-horizontal';
import Table from '@lucide/svelte/icons/table';

// files
import FileVolume from '@lucide/svelte/icons/file-volume';
import FileVideo from '@lucide/svelte/icons/file-video';
import FileImage from '@lucide/svelte/icons/file-image';
import FileText from '@lucide/svelte/icons/file-text';

//editor
import Heading1 from '@lucide/svelte/icons/heading-1';
import Heading2 from '@lucide/svelte/icons/heading-2';
import Heading3 from '@lucide/svelte/icons/heading-3';
import Type from '@lucide/svelte/icons/type';
import ListOrdered from '@lucide/svelte/icons/list-ordered';
import ListBullet from '@lucide/svelte/icons/list';
import ListTodo from '@lucide/svelte/icons/list-todo';
import Quote from '@lucide/svelte/icons/quote';
import Code from '@lucide/svelte/icons/code';
import Minus from '@lucide/svelte/icons/minus';
import Image from '@lucide/svelte/icons/image';

//editor toolbar
import Bold from '@lucide/svelte/icons/bold';
import Italic from '@lucide/svelte/icons/italic';
import Underline from '@lucide/svelte/icons/underline';

// Others
import File from '@lucide/svelte/icons/file';
import Home from '@lucide/svelte/icons/home';
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import BrickWallShield from '@lucide/svelte/icons/brick-wall-shield';
import Library from '@lucide/svelte/icons/library-big';
import Dna from '@lucide/svelte/icons/dna';
import Gallery from '@lucide/svelte/icons/gallery-vertical-end';
import Settings from '@lucide/svelte/icons/settings';
import ShieldCog from '@lucide/svelte/icons/shield-cog';
import Search from '@lucide/svelte/icons/search';
import Shield from '@lucide/svelte/icons/shield';
import Layout from '@lucide/svelte/icons/layout-dashboard';
import Users from '@lucide/svelte/icons/users';
import Megaphone from '@lucide/svelte/icons/megaphone';
import HeartPulse from '@lucide/svelte/icons/heart-pulse';

type IconBundle = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	bundle: Combine,
	file: Paperclip
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
	alarm: AlarmClock,
	alert: AlertTriangle,
	anchor: Anchor,
	angry: Angry,
	annoyed: Annoyed,
	apple: Apple,
	archive: Archive,
	armchair: Armchair,
	award: Award,
	axe: Axe,
	baby: Baby,
	backpack: Backpack,
	banana: Banana,
	banknote: Banknote,
	book: BookOpen,
	calendar: CalendarDays,
	clapperboard: Clapperboard,
	film: Film,
	flag: Flag,
	folder: Folder,
	gem: Gem,
	gift: Gift,
	heart: Heart,
	landmark: Landmark,
	link: Link2,
	medal: Medal,
	repeat: Repeat,
	scale: Scale,
	shopping: ShoppingCart,
	smile: Smile,
	taskBook: BookOpenCheck,
	todo: SquareCheckBig,
	wallet: Wallet,
	workflow: Workflow
};

export const VIEW_ICONS: IconBundle = {
	list: StretchHorizontal,
	table: Table,
	board: Kanban
};

export const FILE_ICONS: IconBundle = {
	audio: FileVolume,
	video: FileVideo,
	image: FileImage,
	text: FileText
};

export const EDITOR_ICONS: IconBundle = {
	heading1: Heading1,
	heading2: Heading2,
	heading3: Heading3,
	text: Type,
	ordered: ListOrdered,
	bullet: ListBullet,
	todo: ListTodo,
	quote: Quote,
	code: Code,
	divider: Minus,
	table: Table,
	image: Image
};

export const EDITOR_TOOLBAR_ICONS = {
	bold: Bold,
	italic: Italic,
	underline: Underline,
	code: Code,
	link: Link
};

export const PAGE_ICONS: IconBundle = {
	...COLLECTION_ICONS,
	home: Home,
	dashboard: LayoutDashboard,
	dashboardadmin: BrickWallShield,
	collections: Library,
	templates: Dna,
	settings: Settings,
	settingsadmin: ShieldCog,
	item: File,
	search: Search,
	security: Shield,
	structure: Layout,
	gallery: Gallery,
	users: Users,
	release: Megaphone,
	system: HeartPulse
};

export const APP_ICONS = {
	...INPUT_ICONS,
	...THEME_ICONS,
	...SORT_ICONS,
	...COLLECTION_ICONS,
	...VIEW_ICONS,
	...PAGE_ICONS
};
