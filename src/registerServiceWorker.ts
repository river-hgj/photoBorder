export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      cacheLoadedAssets(registration)
    } catch (error: unknown) {
      console.error('Service worker registration failed:', error)
    }
  })
}

function cacheLoadedAssets(registration: ServiceWorkerRegistration) {
  const urls = performance
    .getEntriesByType('resource')
    .map((entry) => entry.name)
    .filter((url) => {
      const { origin } = new URL(url)
      return origin === window.location.origin
    })

  registration.active?.postMessage({
    type: 'CACHE_URLS',
    urls: [...new Set(['/', '/index.html', ...urls])],
  })
}
