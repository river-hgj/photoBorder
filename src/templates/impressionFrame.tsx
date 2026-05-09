import { drawCanvasBrandLogo } from '../brand/drawBrandLogo'
import { drawCoverImage } from '../lib/image'
import type { TemplateDefinition, TemplateRenderProps } from '../types'

function drawExport(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  { meta, logo, borderWidth, adjustments, outputScale = 1 }: TemplateRenderProps,
) {
  const canvas = context.canvas
  const blurIntensity = adjustments.blurIntensity ?? 34
  const cornerRadius = adjustments.cornerRadius ?? 0
  const photoShadow = adjustments.photoShadow ?? 32
  const margin = Math.round(borderWidth * outputScale)
  const leftPanelWidth = Math.round(canvas.width * 0.34)
  const photoX = leftPanelWidth + Math.round(margin * 0.72)
  const rightMargin = Math.round(margin * 0.82)
  const photoWidth = Math.max(
    Math.round(canvas.width * 0.36),
    canvas.width - photoX - rightMargin,
  )
  const photoHeight = Math.round(photoWidth * (image.naturalHeight / image.naturalWidth))
  const minHeight = Math.round(canvas.width * 0.56)
  const photoY = Math.round(Math.max(margin, (minHeight - photoHeight) / 2))
  const photoRadius = Math.round(cornerRadius * outputScale)

  canvas.height = Math.max(minHeight, photoY + photoHeight + margin)

  context.fillStyle = '#101513'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.save()
  if (shouldUseCanvasBlurFallback()) {
    drawBlurredBackgroundFallback(context, image, canvas.width, canvas.height, blurIntensity * outputScale)
  } else {
    context.filter = `blur(${blurIntensity * outputScale}px) brightness(0.56) saturate(0.92)`
    drawCoverImage(context, image, 0, 0, canvas.width, canvas.height)
  }
  context.restore()

  context.fillStyle = 'rgba(15, 22, 24, 0.18)'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.save()
  context.shadowColor = 'rgba(0, 0, 0, 0.46)'
  context.shadowBlur = photoShadow * outputScale
  context.shadowOffsetY = 16 * outputScale
  context.fillStyle = '#111516'
  drawRoundedRect(context, photoX, photoY, photoWidth, photoHeight, photoRadius)
  context.fill()
  context.restore()

  context.save()
  drawRoundedRect(context, photoX, photoY, photoWidth, photoHeight, photoRadius)
  context.clip()
  context.drawImage(image, photoX, photoY, photoWidth, photoHeight)
  context.restore()

  const leftCenterX = canvas.width * 0.235
  const logoSize = 72 * outputScale
  const logoTop = canvas.height * 0.21
  const logoFont = `700 ${62 * outputScale}px Georgia, serif`

  drawCanvasBrandLogo(
    context,
    logo,
    meta.logo,
    leftCenterX,
    logoTop,
    logoSize,
    'center',
    '#ffffff',
    logoFont,
  )

  context.fillStyle = 'rgba(255, 255, 255, 0.78)'
  context.font = `700 ${12 * outputScale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  context.textAlign = 'center'
  context.letterSpacing = `${3 * outputScale}px`
  context.fillText(meta.logo.toUpperCase(), leftCenterX, logoTop + logoSize + 18 * outputScale)
  context.letterSpacing = '0px'

  const rows = getExposureRows(meta.params)
  const rowStartY = canvas.height * 0.47
  const rowGap = 82 * outputScale
  rows.forEach((row, index) => {
    const y = rowStartY + rowGap * index
    drawMetricRow(context, row.label, row.value, leftCenterX, y, outputScale)
  })
}

export const impressionFrameTemplate: TemplateDefinition = {
  id: 'impression-frame',
  name: '印象边框',
  description: '模糊背景搭配悬浮照片，左侧展示品牌 Logo、光圈、ISO 与快门。',
  controls: {
    logoStyle: true,
    metaFields: ['logo', 'params'],
    borderWidth: true,
    adjustments: [
      {
        id: 'blurIntensity',
        label: '模糊强度',
        min: 0,
        max: 72,
        step: 2,
        defaultValue: 34,
        unit: 'px',
      },
      {
        id: 'cornerRadius',
        label: '圆角大小',
        min: 0,
        max: 80,
        step: 2,
        defaultValue: 0,
        unit: 'px',
      },
      {
        id: 'photoShadow',
        label: '照片阴影',
        min: 0,
        max: 72,
        step: 2,
        defaultValue: 32,
        unit: 'px',
      },
    ],
  },
  getCanvasWidth: (image, { borderWidth, outputScale = 1 }) => {
    const margin = Math.round(borderWidth * outputScale)
    return image.naturalWidth + margin * 2
  },
  drawExport,
}

function drawMetricRow(
  context: CanvasRenderingContext2D,
  label: string,
  value: string,
  centerX: number,
  centerY: number,
  outputScale: number,
) {
  const badgeWidth = 80 * outputScale
  const badgeHeight = 42 * outputScale
  const badgeX = centerX - 52 * outputScale
  const badgeY = centerY - badgeHeight / 2

  context.save()
  context.strokeStyle = 'rgba(255, 255, 255, 0.74)'
  context.lineWidth = 3 * outputScale
  drawRoundedRect(context, badgeX, badgeY, badgeWidth, badgeHeight, 6 * outputScale)
  context.stroke()

  context.fillStyle = 'rgba(255, 255, 255, 0.84)'
  context.font = `500 ${24 * outputScale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(label, badgeX + badgeWidth / 2, centerY + outputScale)

  context.font = `400 ${25 * outputScale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  context.textAlign = 'left'
  context.fillText(value, centerX + 34 * outputScale, centerY + outputScale)
  context.restore()
}

function getExposureRows(params: string) {
  return [
    { label: 'F', value: findAperture(params) ?? '-' },
    { label: 'ISO', value: findIso(params) ?? '-' },
    { label: 'S', value: findShutter(params) ?? '-' },
  ]
}

function findAperture(params: string) {
  const match = params.match(/(?:f\s*\/?\s*)(\d+(?:\.\d+)?)/i)
  return match?.[1]
}

function findIso(params: string) {
  const match = params.match(/(?:iso\s*)(\d+)/i)
  return match?.[1]
}

function findShutter(params: string) {
  const match = params.match(/(\d+\s*\/\s*\d+|\d+(?:\.\d+)?\s*s)\b/i)
  return match?.[1]?.replace(/\s+/g, '')
}

function shouldUseCanvasBlurFallback() {
  if (typeof navigator === 'undefined') return false

  const platform = navigator.platform || ''
  const userAgent = navigator.userAgent || ''
  const isIpadOsDesktopMode = platform === 'MacIntel' && navigator.maxTouchPoints > 1

  return /iPad|iPhone|iPod/.test(userAgent) || isIpadOsDesktopMode
}

function drawBlurredBackgroundFallback(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  blurRadius: number,
) {
  const scale = Math.min(32, Math.max(4, Math.round(blurRadius / 2)))
  const blurCanvas = document.createElement('canvas')
  const blurContext = blurCanvas.getContext('2d')

  if (!blurContext) {
    drawCoverImage(context, image, 0, 0, width, height)
    return
  }

  blurCanvas.width = Math.max(1, Math.round(width / scale))
  blurCanvas.height = Math.max(1, Math.round(height / scale))

  blurContext.imageSmoothingEnabled = true
  blurContext.imageSmoothingQuality = 'high'
  drawCoverImage(blurContext, image, 0, 0, blurCanvas.width, blurCanvas.height)

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(blurCanvas, 0, 0, width, height)
  context.fillStyle = 'rgba(0, 0, 0, 0.38)'
  context.fillRect(0, 0, width, height)
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const normalizedRadius = Math.min(radius, width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + normalizedRadius, y)
  context.lineTo(x + width - normalizedRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + normalizedRadius)
  context.lineTo(x + width, y + height - normalizedRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - normalizedRadius, y + height)
  context.lineTo(x + normalizedRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - normalizedRadius)
  context.lineTo(x, y + normalizedRadius)
  context.quadraticCurveTo(x, y, x + normalizedRadius, y)
  context.closePath()
}
