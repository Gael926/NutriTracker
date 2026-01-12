/* ========================================
   NutriTracker - Service Worker
   Cache pour mode offline
   ======================================== */

const CACHE_NAME = 'nutritracker-v2';

// Fichiers à mettre en cache
const urlsToCache = [
    './',
    './index.html',
    './app.html',
    './style.css',
    './style.css?v=2',
    './app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
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

    // Ne pas intercepter les requêtes vers n8n (API)
    if (url.hostname.includes('n8n.srv957891.hstgr.cloud')) {
        return; // Laisser passer la requête normalement
    }

    // Stratégie: Cache First pour les ressources statiques
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retourner le cache si disponible
                if (response) {
                    return response;
                }

                // Sinon faire la requête réseau
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Ne pas mettre en cache les requêtes non-GET
                        if (event.request.method !== 'GET') {
                            return networkResponse;
                        }

                        // Mettre en cache la nouvelle ressource
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
                        // En cas d'erreur réseau, retourner une page offline si HTML demandé
                        if (event.request.headers.get('accept').includes('text/html')) {
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
