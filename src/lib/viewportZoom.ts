export function disableViewportZoom() {
  let touchStartY = 0

  const getScrollElement = () => document.scrollingElement ?? document.documentElement

  const canScrollWithinTarget = (event: TouchEvent, deltaY: number) => {
    const path = event.composedPath()

    return path.some((target) => {
      if (!(target instanceof HTMLElement)) return false
      if (target === document.body || target === document.documentElement) return false

      const maxScrollTop = target.scrollHeight - target.clientHeight
      if (maxScrollTop <= 0) return false

      return deltaY > 0 ? target.scrollTop > 0 : target.scrollTop < maxScrollTop - 1
    })
  }

  const preventViewportBoundaryPull = (event: TouchEvent) => {
    if (event.touches.length !== 1) return

    const scrollElement = getScrollElement()
    const touchY = event.touches[0].clientY
    const deltaY = touchY - touchStartY
    if (deltaY === 0 || canScrollWithinTarget(event, deltaY)) return

    const scrollTop = scrollElement.scrollTop
    const maxScrollTop = scrollElement.scrollHeight - window.innerHeight
    const isAtTop = scrollTop <= 0
    const isAtBottom = scrollTop >= maxScrollTop - 1

    if ((isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
      event.preventDefault()
    }
  }

  const preventMultiTouchZoom = (event: TouchEvent) => {
    if (event.touches.length > 1) {
      event.preventDefault()
    }
  }

  const preventGestureZoom = (event: Event) => {
    event.preventDefault()
  }

  document.addEventListener('touchstart', (event) => {
    touchStartY = event.touches[0]?.clientY ?? 0
  })
  document.addEventListener('touchmove', preventMultiTouchZoom, { passive: false })
  document.addEventListener('touchmove', preventViewportBoundaryPull, { passive: false })
  document.addEventListener('gesturestart', preventGestureZoom, { passive: false })
  document.addEventListener('gesturechange', preventGestureZoom, { passive: false })
  document.addEventListener('gestureend', preventGestureZoom, { passive: false })
}
