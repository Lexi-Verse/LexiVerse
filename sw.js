// sw.js - Service Worker for Automatic Updates (Network-First)

// 1. Define the cache name and the essential files for the initial install.
// NOTE: You only need to change this CACHE_NAME manually if you fundamentally
// change the files in FILES_TO_CACHE (e.g., add a new logo).
const CACHE_NAME = 'lexiverse-store-v1';

const FILES_TO_CACHE = [
  './', // Caches the index.html file
  './index.html',
  './logotranslator.png',
  // Add all other critical files here
];

// --- Install Event: For initial setup and taking control ---
self.addEventListener('install', (e) => {
  // Use skipWaiting to immediately activate the new Service Worker 
  // without requiring the user to close all tabs.
  console.log('[SW] Installing and skipping waiting...');
  self.skipWaiting();
  
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching critical assets.');
      return cache.addAll(FILES_TO_CACHE);
    }),
  );
});

// --- Activate Event: For taking immediate control and cleaning up old caches ---
self.addEventListener('activate', (e) => {
  // Use clients.claim() to take control of all existing tabs/windows immediately.
  console.log('[SW] Activating and claiming clients.');
  e.waitUntil(self.clients.claim());

  // Cleanup: Remove old caches to prevent stale data
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        }
      }));
    })
  );
});


// --- Fetch Event: The Auto-Update Logic (Network-First) ---
self.addEventListener('fetch', (e) => {
  // We use a Network-First strategy to guarantee we always try to get the 
  // freshest files from your GitHub commits first.
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // IMPORTANT: If we successfully get a response from the network, 
        // update the cache with the fresh copy.
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Only cache successful requests and non-chrome-extensions requests
          if (response.status === 200 && e.request.url.indexOf('http') === 0) {
              cache.put(e.request, responseClone);
          }
        });
        return response;
      })
      .catch(() => {
        // If the network fails (user is offline), fall back to the cache.
        console.log('[SW] Network failed. Falling back to cache.');
        return caches.match(e.request);
      }),
  );
});
