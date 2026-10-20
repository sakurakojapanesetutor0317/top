/* Kana Renshū: bump VERSION when changing cached local assets. */
const VERSION = 'v3';
const CACHE = 'kana-renshu-' + VERSION;
const CORE = [
  './', 'index.html', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'kanji-n5.json', 'kanji-n4.json'
];
const SHARED = ['/top/assets/css/site-common.css', '/top/assets/js/site-common.js'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    // Shared navigation is optional during installation, e.g. when offline.
    await Promise.allSettled(SHARED.map(path => cache.add(path)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('kana-renshu-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  const inScope = sameOrigin && url.href.startsWith(self.registration.scope);
  const isShared = sameOrigin && SHARED.includes(url.pathname);
  // Do not substitute this app's HTML for other site pages.
  if (req.mode === 'navigate' && !inScope) return;
  if (!inScope && !isShared && !isFont) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const store = async response => {
      if (response && (response.ok || response.type === 'opaque')) {
        try { await cache.put(req, response.clone()); } catch (_) { /* Return usable network response. */ }
      }
      return response;
    };
    if (req.mode === 'navigate' || isShared) {
      try {
        const response = await fetch(req, { cache: 'no-cache' });
        if (!response.ok) {
          const fallback = await cache.match(req);
          if (fallback) return fallback;
        }
        return await store(response);
      } catch (error) {
        const fallback = await cache.match(req)
          || (req.mode === 'navigate' ? await cache.match('index.html') : undefined);
        if (fallback) return fallback;
        throw error;
      }
    }
    const hit = await cache.match(req);
    return hit || store(await fetch(req));
  })());
});
