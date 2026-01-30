/* ========================================
   NutriTracker - Service Worker
   Cache pour mode offline
   ======================================== */

// Incrémenter à chaque déploiement pour forcer le rafraîchissement du cache
const CACHE_NAME = 'nutritracker-v23';

// Fichiers à mettre en cache
const urlsToCache = [
    './',
    './index.html',
    './app.html',
    './style.css',
    './style.css?v=2',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    // Modules JS
    './js/config.js',
    './js/utils.js',
    './js/auth.js',
    './js/nutrition.js',
    './js/history.js',
    './js/edit.js',
    './js/api.js',
    './js/dictation.js',
    './js/settings.js',
    './js/preferences-diner.js',
    './js/water.js',
    './js/app-page.js',
    './js/main.js'
];

// Ressources externes à mettre en cache
const externalResources = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache ouvert');
                // Mettre en cache les fichiers locaux
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // Passer directement à l'activation
                return self.skipWaiting();
            })
    );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Supprimer les anciens caches
                    if (cacheName !== CACHE_NAME) {
                        console.log('Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Prendre le contrôle immédiatement
            return self.clients.claim();
        })
    );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // TOUJOURS utiliser le réseau pour les requêtes API n8n (jamais de cache)
    if (url.hostname.includes('n8n.srv957891.hstgr.cloud')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Stratégie: Network First pour HTML, CSS, JS (pour le développement)
    // Cela garantit que les dernières modifications sont toujours chargées
    const isDevResource = url.pathname.endsWith('.html') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js') ||
        url.pathname === '/' ||
        url.pathname === '';

    if (isDevResource) {
        // Network First: essayer le réseau d'abord, puis le cache
        // cache: 'no-cache' force à bypasser le cache HTTP du navigateur
        // pour toujours récupérer la version la plus récente du serveur
        event.respondWith(
            fetch(event.request, { cache: 'no-cache' })
                .then((networkResponse) => {
                    // Mettre à jour le cache avec la nouvelle version
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Si le réseau échoue, utiliser le cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Cache First pour les autres ressources (images, fonts, etc.)
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(event.request)
                    .then((networkResponse) => {
                        if (event.request.method !== 'GET') {
                            return networkResponse;
                        }

                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return networkResponse;
                    })
                    .catch(() => {
                        if (event.request.headers.get('accept')?.includes('text/html')) {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Gestion des messages
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
