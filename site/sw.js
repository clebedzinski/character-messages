const SHELL = 'messages-shell-v4'
const AVATARS = 'messages-avatars-v1'
const baseUrl = new URL('./', self.location.href)
const base = baseUrl.pathname

function isAvatarRequest(url) {
  if (url.hostname === 'image.pollinations.ai' && url.pathname.startsWith('/prompt/') && url.searchParams.get('avatar') === '1') return true
  return url.origin === self.location.origin && url.pathname.startsWith(`${base}avatars/`) && url.pathname.endsWith('.webp')
}

async function cacheFirstAvatar(request) {
  const cache = await caches.open(AVATARS)
  const hit = await cache.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone()).catch(() => {})
  return response
}

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll([
    base,
    `${base}index.html`,
    `${base}manifest.webmanifest`,
    `${base}favicon.svg`,
  ]).catch(() => {})))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key !== SHELL && key !== AVATARS).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET') return
  if (isAvatarRequest(url)) {
    event.respondWith(cacheFirstAvatar(event.request).catch(() => Response.error()))
    return
  }
  if (url.origin !== self.location.origin || !url.pathname.startsWith(base)) return
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone()
        caches.open(SHELL).then((cache) => cache.put(event.request, copy)).catch(() => {})
        return response
      })
      .catch(async () => (await caches.match(event.request)) || (await caches.match(`${base}index.html`)) || Response.error()),
  )
})
