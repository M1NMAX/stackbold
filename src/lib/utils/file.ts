export function isImageFile(name: string) {
	return /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)$/i.test(name);
}

export function isVideoFile(name: string) {
	return /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv|m4v|3gp|mpeg|mpg)$/i.test(name);
}

export function isAudioFile(name: string) {
	return /\.(mp3|wav|ogg|m4a|aac|flac|wma|aiff|ape|opus|webm|oga)$/i.test(name);
}

export async function uploadFileToUrl(url: string, file: File) {
	return await fetch(url, {
		method: 'PUT',
		body: file,
		headers: {
			'Content-Type': file.type
		}
	});
}

export function incrementFileName(originalName: string, existingNames: string[]) {
	const lastDotIndex = originalName.lastIndexOf('.');
	const hasExtension = lastDotIndex > 0;

	const name = hasExtension ? originalName.slice(0, lastDotIndex) : originalName;
	const ext = hasExtension ? originalName.slice(lastDotIndex) : '';

	if (!existingNames.includes(originalName)) return originalName;

	let counter = 1;
	let fileName;

	do {
		fileName = `${name} (${counter})${ext}`;
		counter++;
	} while (existingNames.includes(fileName));

	return fileName;
}
