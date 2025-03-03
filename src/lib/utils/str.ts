export function capitalizeFirstLetter(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function pluralize(word: string, count: number, suffix: string) {
	return `${count} ${word}${count !== 1 ? suffix : ''}`;
}
