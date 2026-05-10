export function registerServiceWorker() {
  if (__HARMONY_RAWFILE__ || !('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
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
    urls: [...new Set([import.meta.env.BASE_URL, `${import.meta.env.BASE_URL}index.html`, ...urls])],
  })
}
