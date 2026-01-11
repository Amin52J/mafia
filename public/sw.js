const CACHE_NAME = 'mafia-v7';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/bell.mp3',
  '/bell-repeat.mp3',
  '/night.mp3',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isAudio = url.pathname.endsWith('.mp3');

  if (isAudio) {
    // Cache-First strategy for audio, with Range request support
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse.blob().then((blob) => {
            const range = event.request.headers.get('range');
            
            // If no range request, return full blob with Accept-Ranges
            if (!range) {
              return new Response(blob, {
                status: 200,
                statusText: 'OK',
                headers: {
                  'Content-Type': 'audio/mpeg',
                  'Content-Length': blob.size,
                  'Accept-Ranges': 'bytes',
                },
              });
            }

            const match = range.match(/bytes=(\d+)-(\d+)?/);
            if (!match) {
              // If range header is malformed, return full blob as fallback
              return new Response(blob, {
                status: 200,
                statusText: 'OK',
                headers: {
                  'Content-Type': 'audio/mpeg',
                  'Content-Length': blob.size,
                  'Accept-Ranges': 'bytes',
                },
              });
            }

            const start = parseInt(match[1], 10);
            const end = match[2] ? parseInt(match[2], 10) : blob.size - 1;

            if (start >= blob.size || end >= blob.size || start > end) {
              return new Response(null, {
                status: 416,
                statusText: 'Range Not Satisfiable',
                headers: { 
                  'Content-Range': `bytes */${blob.size}`,
                  'Accept-Ranges': 'bytes',
                },
              });
            }

            const chunk = blob.slice(start, end + 1);

            return new Response(chunk, {
              status: 206,
              statusText: 'Partial Content',
              headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Range': `bytes ${start}-${end}/${blob.size}`,
                'Content-Length': chunk.size,
                'Accept-Ranges': 'bytes',
              },
            });
          });
        }

        // Fallback to network if not in cache
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
  } else {
    // Stale-While-Revalidate strategy for other assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
