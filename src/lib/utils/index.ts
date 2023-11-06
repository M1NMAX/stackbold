export const capitalizeFirstLetter = (text: string) =>
	text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

export const pluralize = (word: string, count: number, suffix: string) =>
	`${count} ${word}${count !== 1 ? suffix : ''}`;
