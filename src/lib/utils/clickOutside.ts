export function clickOutside(node: HTMLElement) {
	const handleClick = ({ target }: MouseEvent) => {
		if (node && !node.contains(target as Node)) {
			node.dispatchEvent(new CustomEvent('clickoutside'));
		}
	};

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}
