export function capitalizeFirstLetter(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function pluralize(word: string, count: number, suffix: string) {
	return `${count} ${word}${count !== 1 ? suffix : ''}`;
}

export function truncateTextEnd(text: string, maxLength: number) {
	if (text.length < maxLength) return text;
	return text.substring(0, maxLength - 3) + '...';
}

export function truncateTextMiddle(text: string, maxLength: number) {
	if (text.length <= maxLength) return text;
	const charsToShow = maxLength - 3;
	const frontChars = Math.ceil(charsToShow / 2);
	const backChars = Math.floor(charsToShow / 2);
	return text.substring(0, frontChars) + '...' + text.substring(text.length - backChars);
}

export function truncateDomain(url: string, maxLength: number) {
	try {
		const urlObj = new URL(url);
		const domain = urlObj.hostname.substring(4, urlObj.hostname.length);
		const path = urlObj.pathname + urlObj.search;

		if ((domain + path).length <= maxLength) return domain + path;
		return truncateTextMiddle(domain + path, maxLength);
	} catch {
		return truncateTextEnd(url, maxLength);
	}
}
