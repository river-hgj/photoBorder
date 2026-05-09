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

  const logoImage = selectLogoImage(logo)

  if (!logoImage) {
    context.font = font
    context.textAlign = align
    context.fillText(label, x, y + size * 0.78)
    return
  }

  const { image } = logoImage
  const { width, height } = getLogoDrawSize(image, size, logo.scale)
  const left = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x
  const top = y + (size - height) / 2

  context.drawImage(image, left, top, width, height)
}

export function measureCanvasBrandLogo(
  context: CanvasRenderingContext2D,
  logo: BrandLogoData,
  label: string,
  size: number,
  _color: string,
  font: string,
) {
  const logoImage = selectLogoImage(logo)

  if (!logoImage) {
    context.font = font
    return context.measureText(label).width
  }

  return getLogoDrawSize(logoImage.image, size, logo.scale).width
}

function selectLogoImage(logo: BrandLogoData) {
  const selectedAsset = logo.source?.assets.find((asset) => asset.id === logo.selectedAssetId)
  const fallbackAsset = selectedAsset ?? logo.source?.assets[0]
  const image = fallbackAsset ? logo.images?.[fallbackAsset.id] : undefined

  return image ? { image } : undefined
}

function getLogoDrawSize(image: HTMLImageElement, size: number, logoScale?: number) {
  const scale = logoScale ?? 1
  const scaledSize = size * scale
  const aspectRatio = image.naturalWidth / image.naturalHeight || 1
  const maxWidth = scaledSize * 4.6
  const width = Math.min(scaledSize * aspectRatio, maxWidth)
  const height = width / aspectRatio

  return { width, height }
}
