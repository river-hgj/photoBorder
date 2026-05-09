import type { BrandLogoData } from '../types'

export function drawCanvasBrandLogo(
  context: CanvasRenderingContext2D,
  logo: BrandLogoData,
  label: string,
  x: number,
  y: number,
  size: number,
  align: CanvasTextAlign,
  color: string,
  font: string,
) {
  context.fillStyle = color

  const logoImage = selectLogoImage(logo, color)

  if (!logoImage) {
    context.font = font
    context.textAlign = align
    context.fillText(label, x, y + size * 0.78)
    return
  }

  const { image, shouldTint } = logoImage
  const { width, height } = getLogoDrawSize(image, size)
  const left = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x
  const top = y + (size - height) / 2

  if (!shouldTint) {
    context.drawImage(image, left, top, width, height)
    return
  }

  context.save()
  context.drawImage(image, left, top, width, height)
  context.globalCompositeOperation = 'source-in'
  context.fillStyle = color
  context.fillRect(left, top, width, height)
  context.restore()
}

export function measureCanvasBrandLogo(
  context: CanvasRenderingContext2D,
  logo: BrandLogoData,
  label: string,
  size: number,
  color: string,
  font: string,
) {
  const logoImage = selectLogoImage(logo, color)

  if (!logoImage) {
    context.font = font
    return context.measureText(label).width
  }

  return getLogoDrawSize(logoImage.image, size).width
}

function selectLogoImage(logo: BrandLogoData, color: string) {
  if (logo.variant === 'color' && logo.images?.color) {
    return { image: logo.images.color, shouldTint: false }
  }

  const monoImage = shouldUseWhiteLogo(color) ? logo.images?.white : logo.images?.black

  if (monoImage) return { image: monoImage, shouldTint: false }
  if (logo.images?.black) return { image: logo.images.black, shouldTint: false }
  if (logo.images?.white) return { image: logo.images.white, shouldTint: false }
  if (logo.images?.color) return { image: logo.images.color, shouldTint: logo.variant === 'mono' }

  return undefined
}

function getLogoDrawSize(image: HTMLImageElement, size: number) {
  const aspectRatio = image.naturalWidth / image.naturalHeight || 1
  const maxWidth = size * 4.6
  const width = Math.min(size * aspectRatio, maxWidth)
  const height = width / aspectRatio

  return { width, height }
}

function shouldUseWhiteLogo(color: string) {
  const normalized = color.trim().toLowerCase()

  if (normalized === 'white' || normalized === '#fff' || normalized === '#ffffff') return true
  if (!normalized.startsWith('#')) return false

  const hex = normalized.slice(1)
  const fullHex =
    hex.length === 3
      ? hex
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : hex

  if (fullHex.length !== 6) return false

  const red = Number.parseInt(fullHex.slice(0, 2), 16)
  const green = Number.parseInt(fullHex.slice(2, 4), 16)
  const blue = Number.parseInt(fullHex.slice(4, 6), 16)

  return red * 0.299 + green * 0.587 + blue * 0.114 > 180
}
