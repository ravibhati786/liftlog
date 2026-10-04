// Offline support: the app shell is cached on install; exercise animations are cached the
// first time they are viewed, so a workout you've done before works with no signal.
// Bump VERSION whenever any app file changes so phones pick up the update.
const VERSION = 'liftlog-v1'
const MEDIA = 'liftlog-media'
const SHELL = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/store.js', 'js/util.js', 'js/plans.js', 'js/exercises.js', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== MEDIA).map(k => caches.delete(k))))
    .then(() => self.clients.claim()))
})

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.open(MEDIA).then(async c => {
      const hit = await c.match(req)
      if (hit) return hit
      const res = await fetch(req)
      if (res.ok || res.type === 'opaque') c.put(req, res.clone())
      return res
    }))
    return
  }

  if (url.origin === location.origin) {
    // Network first so updates arrive quickly; fall back to cache offline.
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)) }
      return res
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))))
  }
})
