const fallbackThemeColor = '#151719'

type SystemBarBridge = {
  setThemeColor?: (color: string) => void
}

declare global {
  interface Window {
    photoBorderSystemBar?: SystemBarBridge
    setAppThemeColor?: (color: string) => void
  }
}

let lastPublishedColor = ''
let animationFrame = 0
let initialized = false

function toHexColor(color: string | null | undefined) {
  if (!color || color === 'transparent') return ''

  const trimmedColor = color.trim()
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmedColor)) {
    return trimmedColor
  }

  const rgb = trimmedColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i)
  if (!rgb || Number(rgb[4] ?? 1) === 0) return ''

  return `#${[rgb[1], rgb[2], rgb[3]]
    .map((value) => Number(value).toString(16).padStart(2, '0'))
    .join('')}`
}

function getThemeColor() {
  const metaColor = document.querySelector('meta[name="theme-color"]')?.getAttribute('content')
  return toHexColor(metaColor) || fallbackThemeColor
}

function getTopContentColor() {
  let element = document.elementFromPoint(Math.max(1, window.innerWidth / 2), 1)

  while (element && element !== document.documentElement) {
    const color = toHexColor(getComputedStyle(element).backgroundColor)
    if (color) return color
    element = element.parentElement
  }

  return getThemeColor()
}

function publishThemeColor(color: string) {
  const nextColor = toHexColor(color) || fallbackThemeColor
  if (nextColor === lastPublishedColor) return

  lastPublishedColor = nextColor
  window.photoBorderSystemBar?.setThemeColor?.(nextColor)
}

function syncThemeColor() {
  animationFrame = 0
  publishThemeColor(getTopContentColor())
}

function scheduleThemeColorSync() {
  if (animationFrame) return
  animationFrame = window.requestAnimationFrame(syncThemeColor)
}

export function initializeSystemBarTheme() {
  if (initialized) return
  initialized = true

  window.setAppThemeColor = (color: string) => {
    let meta = document.querySelector('meta[name="theme-color"]')

    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
    }

    meta.setAttribute('content', color)
    publishThemeColor(color)
  }

  new MutationObserver(scheduleThemeColorSync).observe(document.head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['content'],
  })

  window.addEventListener('scroll', scheduleThemeColorSync, { passive: true })
  window.addEventListener('resize', scheduleThemeColorSync, { passive: true })
  window.addEventListener('DOMContentLoaded', scheduleThemeColorSync)
  window.addEventListener('load', scheduleThemeColorSync)
  scheduleThemeColorSync()
}
