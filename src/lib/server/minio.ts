import * as Minio from 'minio';
import { MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY } from '$env/static/private';
import {
	APP_BUCKET,
	DEFAULT_PRESIGNED_URL_DOWNLOAD_DURATION,
	DEFAULT_PRESIGNED_URL_UPLOAD_DURATION
} from '$lib/constant/index.js';

const minioClient = new Minio.Client({
	endPoint: MINIO_ENDPOINT,
	accessKey: MINIO_ACCESS_KEY,
	secretKey: MINIO_SECRET_KEY
});

export async function getFilePresignedUploadUrl(fileName: string) {
	return minioClient.presignedPutObject(
		APP_BUCKET,
		fileName,
		DEFAULT_PRESIGNED_URL_UPLOAD_DURATION
	);
}

export async function getFilePresignedDownloadUrl(fileName: string) {
	const downloadName = fileName.split('/').pop() || fileName;
	return minioClient.presignedGetObject(
		APP_BUCKET,
		fileName,
		DEFAULT_PRESIGNED_URL_DOWNLOAD_DURATION,
		{
			'response-content-disposition': `attachment; filename="${downloadName}"`
		}
	);
}

export async function deleteFile(fileName: string) {
	return await minioClient.removeObject(APP_BUCKET, fileName);
}
