/* Bearing service worker: works offline after the first visit. */
const CACHE = 'bearing-2026-10-19d';
const SHELL = ['./', 'index.html', 'style.css', 'config.js', 'data.js', 'jobs2.js', 'onet.js', 'app.js', 'manifest.webmanifest',
  'privacy.html', 'fonts/fonts.css', 'fonts/instrument-serif-latin-400-normal.woff2', 'fonts/instrument-serif-latin-400-italic.woff2',
  'fonts/public-sans-latin-400-normal.woff2', 'fonts/public-sans-latin-500-normal.woff2', 'fonts/public-sans-latin-600-normal.woff2',
  'fonts/ibm-plex-mono-latin-400-normal.woff2', 'fonts/ibm-plex-mono-latin-500-normal.woff2', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Invite and results links carry their data in the query string: always serve the app shell for them.
  if (req.mode === 'navigate' && url.origin === location.origin) {
    e.respondWith(caches.match('index.html').then(r => r || fetch(req)));
    return;
  }
  // Fonts: use the cached copy, refresh it in the background.
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // config.js holds the feedback address: always try the network first so edits take effect.
  if (url.origin === location.origin && url.pathname.endsWith('/config.js')) {
    e.respondWith(fetch(req).then(res => { caches.open(CACHE).then(c => c.put(req, res.clone())); return res; }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
  }
});
