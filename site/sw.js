const cacheEnabled = new URL(self.location.href).searchParams.has('cache')
const CACHE = 'messages-shell-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  if (!cacheEnabled) return
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/character-messages/', '/character-messages/index.html', '/character-messages/manifest.webmanifest', '/character-messages/favicon.svg'])),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  if (!cacheEnabled) return
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {})
        return response
      })
      .catch(async () => {
        const hit = await caches.match(event.request)
        return hit || caches.match('/character-messages/index.html')
      }),
  )
})
