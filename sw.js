/* ===== 四六级智学 Service Worker（仅在 http/https 下注册，file:// 直开不受影响）=====
   策略：网络优先 + 离线回退。在线时总是拿最新代码（升级即生效），
   断网时回退到缓存（首次访问后即具备完整离线能力）。 */
const CACHE = 'cet-study-runtime-v1.5.0';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      const hit = await caches.match(req);
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const ih = await caches.match('./index.html');
        if (ih) return ih;
      }
      throw err;
    }
  })());
});
