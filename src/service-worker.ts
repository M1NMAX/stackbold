/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker"  />

declare let self: ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];
// install service worker
self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}
	event.waitUntil(addFilesToCache());
});

// activate service worker
self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) {
				await caches.delete(key);
			}
		}
	}
	event.waitUntil(deleteOldCaches());
});

// lsiten to fetch events
self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	async function response() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// serve build cache from the cache
		if (ASSETS.includes(url.pathname)) {
			const cachedResponse = await cache.match(url.pathname);

			if (cachedResponse) return cachedResponse;
		}

		// try the network first
		try {
			const response = await fetch(event.request);

			const isNotExtension = url.protocol === 'http';
			const isSuccess = response.status === 200;

			if (isNotExtension && isSuccess) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch {
			// fall back to cache

			const cachedResponse = await cache.match(url.pathname);
			if (cachedResponse) return cachedResponse;
		}

		return new Response('Not found', { status: 404 });
	}

	event.respondWith(response());
});

self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
