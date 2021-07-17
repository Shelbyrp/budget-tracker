const STATIC_FILEPATHS = [
    "/",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/db.js",
    "/index.html",
    "/index.js",
    "/service-worker.js",
    "/styles.css",
    "/manifest.json",
];
const STATIC_CACHE_KEY = "static-cache-v1";
const RUNTIME_CACHE_KEY = "runtime-cache-v1";

self.oninstall = event => event.waitUntil(install());
self.onactivate = event => event.waitUntil(activate());
self.onfetch = event => {
    if (event.request.method === "GET") {
        event.respondWith(progressiveFetch(event.request));
    }
};

async function install() {
    try {
        const staticCache = await caches.open(STATIC_CACHE_KEY);
        await staticCache.addAll(STATIC_FILEPATHS);
        self.skipWaiting();
    } catch (err) {
        console.log(err);
    }
}

async function activate() {
    try {
        const keyList = await caches.keys();
        for (const key of keyList) {
            if (key !== STATIC_CACHE_KEY && key !== RUNTIME_CACHE_KEY) {
                await caches.delete(key);
            }
        }
        self.clients.claim();
    } catch (err) {
        console.log(err);
    }
}

async function progressiveFetch(request) {
    try {
        return request.url.includes("/api/")
            ? await getRuntimeResource(request)
            : await getStaticResource(request);
    } catch (err) {
        console.log(err);
    }
}

async function getRuntimeResource(request) {
    try {
        const response = await fetch(request);
        if (response.status === 200) {
            const runtimeCache = await caches.open(RUNTIME_CACHE_KEY);
            runtimeCache.put(request.url, response.clone());
        }
        return response;
    } catch (_err) {
        return await getCachedRuntimeResource(request);
    }
}

async function getCachedRuntimeResource(request) {
    try {
        const runtimeCache = await caches.open(RUNTIME_CACHE_KEY);
        return await runtimeCache.match(request);
    } catch (err) {
        console.log(err);
    }
}

async function getStaticResource(request) {
    try {
        const staticCache = await caches.open(STATIC_CACHE_KEY);
        const response = await staticCache.match(request);
        return response || fetch(request);
    } catch (err) {
        console.log(err);
    }
}