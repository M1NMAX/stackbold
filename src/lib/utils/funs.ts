export function noCheck(x: any) {
	return x;
}

export function preventEnterKeypress(e: KeyboardEvent) {
	if (e.key == 'Enter') e.preventDefault();
}
