const CACHE = 'one-more-move-__CACHE_VERSION__'
const ASSETS = ['./', './index.html', './privacy.html', './styles.css', './game.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-192.png', './icon-maskable-512.png']

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)))
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('one-more-move-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()))
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    const isAppShell = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')
    event.respondWith(fetch(request).then(async response => {
      if (response.ok && isAppShell) {
        const cache = await caches.open(CACHE)
        await cache.put('./index.html', response.clone())
      }
      return response
    }).catch(async () => (await caches.match(request)) || caches.match('./index.html')))
    return
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()))
    return response
  })))
})
