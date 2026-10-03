const CACHE_VERSION = 'deentime-v1.0.0';
const CORE_CACHE = CACHE_VERSION + '-core';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';
const BASE_URL = self.registration.scope;

const STATIC_ASSETS = [
    '',
    'index.html',
    'style.css',
    'praytimes.js',
    'names-of-allah.js',
    'script-core.js',
    'phase4.js',
    'phase5.js',
    'phase6.js',
    'phase7.js',
    'manifest.json',
    'icons/icon-72x72.png',
    'icons/icon-96x96.png',
    'icons/icon-128x128.png',
    'icons/icon-144x144.png',
    'icons/icon-152x152.png',
    'icons/icon-192x192.png',
    'icons/icon-384x384.png',
    'icons/icon-512x512.png'
].map(path => new URL(path, BASE_URL).toString());

function isExternal(request) {
    return new URL(request.url).origin !== self.location.origin;
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CORE_CACHE)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(names => Promise.all(
                names
                    .filter(name => name.startsWith('deentime-') && !name.startsWith(CACHE_VERSION))
                    .map(name => caches.delete(name))
            ))
            .then(() => self.clients.claim())
            .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
            .then(clients => clients.forEach(client => client.postMessage({ type: 'DEENTIME_SW_UPDATED', version: CACHE_VERSION })))
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const isNavigation = request.mode === 'navigate' || request.destination === 'document';
    const external = isExternal(request);

    if (isNavigation) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CORE_CACHE).then(cache => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(new URL('index.html', BASE_URL)))
        );
        return;
    }

    if (external) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    event.respondWith(
        caches.match(request)
            .then(cached => {
                const network = fetch(request)
                    .then(response => {
                        if (response && response.ok) {
                            const copy = response.clone();
                            caches.open(CORE_CACHE).then(cache => cache.put(request, copy));
                        }
                        return response;
                    })
                    .catch(() => cached);
                return cached || network;
            })
    );
});

self.addEventListener('push', event => {
    if (!event.data) return;
    const data = event.data.json();
    event.waitUntil(
        self.registration.showNotification(data.title || 'DeenTime', {
            body: data.body || 'Prayer reminder',
            icon: new URL('icons/icon-192x192.png', BASE_URL).toString(),
            badge: new URL('icons/icon-72x72.png', BASE_URL).toString(),
            tag: data.tag || 'prayer',
            requireInteraction: true
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(clients.openWindow(BASE_URL));
});
