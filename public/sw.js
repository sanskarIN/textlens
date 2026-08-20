const CACHE_NAME = "textlens-pwa-v2.0.12-3";
const APP_ROOT = new URL("./", self.location.href);
const APP_ROOT_URL = APP_ROOT.toString();
const CACHEABLE_ASSET_PATTERN = /\.(?:js|css|svg|png|woff2?|webmanifest)$/i;
const CORE_ASSETS = [
  "",
  "index.html",
  "manifest.webmanifest",
  "logo.svg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
].map((path) => new URL(path, APP_ROOT).toString());

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_ASSETS);

      try {
        const response = await fetch(APP_ROOT_URL, { cache: "no-store" });
        const html = await response.text();
        const assetUrls = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
          .map((match) => {
            try {
              return new URL(match[1], APP_ROOT);
            } catch {
              return null;
            }
          })
          .filter(
            (url) =>
              url !== null &&
              url.origin === self.location.origin &&
              CACHEABLE_ASSET_PATTERN.test(url.pathname),
          )
          .map((url) => url.toString());
        await Promise.all(
          [...new Set(assetUrls)].map((url) => cache.add(url).catch(() => undefined)),
        );
      } catch {
        // The core shell is already cached; dynamic asset precaching can retry during normal runtime requests.
      }

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("textlens-pwa-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(APP_ROOT_URL, response.clone()).catch(() => undefined);
          }
          return response;
        } catch {
          return (await caches.match(APP_ROOT_URL)) || Response.error();
        }
      })(),
    );
    return;
  }

  if (!CACHEABLE_ASSET_PATTERN.test(url.pathname)) return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    })(),
  );
});
