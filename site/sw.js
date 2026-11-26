const CACHE = 'messages-shell-v2'
const baseUrl = new URL('./', self.location.href)
const base = baseUrl.pathname

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([
    base,
    `${base}index.html`,
    `${base}manifest.webmanifest`,
    `${base}favicon.svg`,
  ]).catch(() => {})))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return
  if (!url.pathname.startsWith(base)) return
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {})
        return response
      })
      .catch(async () => (await caches.match(event.request)) || (await caches.match(`${base}index.html`)) || Response.error()),
  )
})
