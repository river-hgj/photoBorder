export function disableViewportZoom() {
  const preventMultiTouchZoom = (event: TouchEvent) => {
    if (event.touches.length > 1) {
      event.preventDefault()
    }
  }

  const preventGestureZoom = (event: Event) => {
    event.preventDefault()
  }

  document.addEventListener('touchmove', preventMultiTouchZoom, { passive: false })
  document.addEventListener('gesturestart', preventGestureZoom, { passive: false })
  document.addEventListener('gesturechange', preventGestureZoom, { passive: false })
  document.addEventListener('gestureend', preventGestureZoom, { passive: false })
}
