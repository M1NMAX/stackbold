export function timeAgo(date: Date) {
	const now = Date.now();
	const past = new Date(date).getTime();
	const diff = Math.floor((past - now) / 1000); // negative = past

	const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

	const intervals: [Intl.RelativeTimeFormatUnit, number][] = [
		['year', 31536000],
		['month', 2592000],
		['week', 604800],
		['day', 86400],
		['hour', 3600],
		['minute', 60],
		['second', 1]
	];

	for (const [unit, secs] of intervals) {
		const count = Math.floor(Math.abs(diff) / secs);
		if (count >= 1) {
			return rtf.format(-count, unit); // negative = past
		}
	}

	return 'just now';
}
