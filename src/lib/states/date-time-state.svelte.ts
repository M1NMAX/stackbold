import { LOCALE } from '$lib/constant';
import {
	DateFormatter,
	endOfMonth,
	endOfWeek,
	getLocalTimeZone,
	isSameDay,
	isSameMonth,
	isToday,
	startOfMonth,
	startOfWeek,
	type CalendarDate
} from '@internationalized/date';

class Day {
	date: CalendarDate;
	isSelected: boolean;
	isToday: boolean;
	isDisabled: boolean;

	constructor(date: CalendarDate, isSelected: boolean, isToday: boolean, isDisabled: boolean) {
		this.date = date;
		this.isSelected = isSelected;
		this.isToday = isToday;
		this.isDisabled = isDisabled;
	}
}

class Month {
	title: string;
	days: Day[];
	constructor(days: Day[], title: string) {
		this.days = days;
		this.title = title;
	}
}
export function fullDateTimeFormat(date: Date) {
	return new DateFormatter(LOCALE, { dateStyle: 'long', timeStyle: 'medium' }).format(date);
}

export function fullDateFormat(date: Date) {
	return new DateFormatter(LOCALE, { dateStyle: 'long' }).format(date);
}

export function fullMonthAndYearFormat(date: Date) {
	return new DateFormatter(LOCALE, { month: 'long', year: 'numeric' }).format(date);
}

export function createMonth(ref: CalendarDate, value: CalendarDate) {
	const days: Day[] = [];

	const end = endOfWeek(endOfMonth(ref), LOCALE);
	let current = startOfWeek(startOfMonth(ref), LOCALE);

	while (current.compare(end) <= 0) {
		days.push(
			new Day(
				current,
				isSameDay(current, value),
				isToday(current, getLocalTimeZone()),
				!isSameMonth(current, ref)
			)
		);
		current = current.add({ days: 1 });
	}

	return new Month(days, fullMonthAndYearFormat(ref.toDate(getLocalTimeZone())));
}
