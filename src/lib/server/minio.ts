import * as Minio from 'minio';
import {
	APP_BUCKET,
	MINIO_ENDPOINT,
	MINIO_ACCESS_KEY,
	MINIO_SECRET_KEY
} from '$env/static/private';
import {
	DEFAULT_PRESIGNED_URL_DOWNLOAD_DURATION,
	DEFAULT_PRESIGNED_URL_UPLOAD_DURATION
} from '$lib/constant/index.js';

const minioClient = new Minio.Client({
	endPoint: MINIO_ENDPOINT,
	accessKey: MINIO_ACCESS_KEY,
	secretKey: MINIO_SECRET_KEY
});

export async function getFilePresignedUploadUrl(filename: string) {
	return minioClient.presignedPutObject(
		APP_BUCKET,
		filename,
		DEFAULT_PRESIGNED_URL_UPLOAD_DURATION
	);
}

export async function getFilePresignedDownloadUrl(filename: string) {
	const downloadName = filename.split('/').pop() || filename;
	return minioClient.presignedGetObject(
		APP_BUCKET,
		filename,
		DEFAULT_PRESIGNED_URL_DOWNLOAD_DURATION,
		{
			'response-content-disposition': `attachment; filename="${downloadName}"`
		}
	);
}

export async function deleteFile(filename: string) {
	return await minioClient.removeObject(APP_BUCKET, filename);
}

export async function listObjects(prefix: string, extra: string = '') {
	const stream = minioClient.listObjects(APP_BUCKET, prefix, true);

	const objsList: string[] = [];

	for await (const obj of stream) {
		if (!obj.name || (extra && !obj.name.includes(extra))) continue;
		objsList.push(obj.name);
	}

	return objsList;
}

export async function removeObjects(objectsList: string[]) {
	if (objectsList.length === 0) return;
	await minioClient.removeObjects(APP_BUCKET, objectsList);
}
