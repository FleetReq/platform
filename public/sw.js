// ── Version ──────────────────────────────────────────────────────────────────
// Bump CACHE_NAME whenever you make a breaking change to the cache strategy
// or need to force all clients to re-fetch (e.g. after changing PRECACHE_URLS).
// Format: 'fleetreq-vN'. The activate handler purges all caches with a
// different name, so old assets are cleaned up automatically on the next load.
const CACHE_NAME = 'fleetreq-v2'

// Pages to precache for offline fallback.
// NOTE: Do NOT include auth-gated pages (e.g. /dashboard) — cache.addAll fetches
// them during SW install, which may store a redirect or stale HTML for signed-out
// users. The network-first navigation handler falls back to '/' for unmatched pages.
const PRECACHE_URLS = [
  '/',
  '/login',
  '/pricing',
  '/icon.svg',
]

// ── Install: precache app shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      // skipWaiting is chained here so it only runs if precaching succeeds.
      // Keeping it outside waitUntil risks activating a broken worker.
      .then(() => self.skipWaiting())
  )
})

// ── Activate: delete stale caches, then claim clients ────────────────────────
self.addEventListener('activate', (event) => {
  // clients.claim() is inside waitUntil so pages are only taken over after
  // stale cache deletion completes — prevents serving deleted cache entries.
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// ── Fetch: routing strategy ──────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Network-only: API routes, auth, Supabase, Stripe — never cache these
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('stripe.com')
  ) {
    return // fall through to browser default (network)
  }

  // Cache-first: static assets (JS, CSS, fonts, images)
  // These are content-hashed by Next.js so a cache miss just fetches the new hash
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((response) => {
              if (response.ok) {
                const clone = response.clone()
                caches.open(CACHE_NAME)
                  .then((cache) => cache.put(request, clone))
                  .catch(() => { /* storage quota exceeded — cache miss is acceptable */ })
              }
              return response
            })
            .catch(() => new Response('', { status: 503, statusText: 'Offline' }))
      )
    )
    return
  }

  // Network-first: HTML navigation — always try fresh, fall back to cache.
  // If the specific page isn't cached, falls back to '/' (marketing page).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, clone))
              .catch(() => { /* storage quota exceeded — cache miss is acceptable */ })
          }
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/'))
        )
    )
    return
  }
})
