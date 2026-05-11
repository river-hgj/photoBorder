import { drawCanvasBrandLogo, measureCanvasBrandLogo } from '../brand/drawBrandLogo'
import { drawCoverImage } from '../lib/image'
import type { TemplateDefinition, TemplateRenderProps } from '../types'

function drawExport(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  { meta, logo, borderWidth, adjustments, outputScale = 1 }: TemplateRenderProps,
) {
  const blurIntensity = adjustments.blurIntensity ?? 36
  const cornerRadius = adjustments.cornerRadius ?? 16
  const canvas = context.canvas
  const margin = Math.round(borderWidth * outputScale * (92 / 132))
  const photoWidth = canvas.width - margin * 2
  const photoHeight = Math.round(photoWidth * (image.naturalHeight / image.naturalWidth))
  const photoRect = {
    x: margin,
    y: margin,
    width: photoWidth,
    height: photoHeight,
  }

  canvas.height = photoHeight + margin * 2

  context.fillStyle = '#101513'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.save()
  if (shouldUseCanvasBlurFallback()) {
    drawBlurredBackgroundFallback(context, image, canvas.width, canvas.height, blurIntensity * outputScale)
  } else {
    context.filter = `blur(${blurIntensity * outputScale}px) brightness(0.48) saturate(1.1)`
    drawCoverImage(context, image, 0, 0, canvas.width, canvas.height)
  }
  context.restore()

  const photoRadius = Math.round(cornerRadius * outputScale)

  context.save()
  context.shadowColor = 'rgba(0, 0, 0, 0.42)'
  context.shadowBlur = Math.round(borderWidth * outputScale * (26 / 132))
  context.shadowOffsetY = Math.round(borderWidth * outputScale * (14 / 132))
  context.fillStyle = '#0c0f10'
  drawRoundedRect(context, photoRect.x, photoRect.y, photoRect.width, photoRect.height, photoRadius)
  context.fill()
  context.restore()

  context.save()
  drawRoundedRect(context, photoRect.x, photoRect.y, photoRect.width, photoRect.height, photoRadius)
  context.clip()
  context.drawImage(image, photoRect.x, photoRect.y, photoRect.width, photoRect.height)
  context.restore()

  const logoSize = 40 * outputScale
  const logoFont = `700 ${36 * outputScale}px Georgia, serif`
  const modelFont = `500 ${28 * outputScale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  const paramsFont = `400 ${22 * outputScale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

  const rowCenterY = photoRect.y + photoRect.height + margin / 2

  context.font = logoFont
  const logoWidth = measureCanvasBrandLogo(context, logo, meta.logo, logoSize, '#ffffff', logoFont)
  context.font = modelFont
  const modelWidth = context.measureText(meta.device).width
  const topRowGap = 16 * outputScale
  const topRowWidth = logoWidth + topRowGap + modelWidth
  const topRowStartX = canvas.width / 2 - topRowWidth / 2

  drawCanvasBrandLogo(
    context,
    logo,
    meta.logo,
    topRowStartX,
    rowCenterY - logoSize - 8 * outputScale,
    logoSize,
    'left',
    '#ffffff',
    logoFont,
  )

  context.font = modelFont
  context.fillStyle = 'rgba(255, 255, 255, 0.9)'
  context.textAlign = 'left'
  context.fillText(meta.device, topRowStartX + logoWidth + topRowGap, rowCenterY - 10 * outputScale)

  context.font = paramsFont
  context.fillStyle = 'rgba(255, 255, 255, 0.75)'
  context.textAlign = 'center'
  context.fillText(meta.params, canvas.width / 2, rowCenterY + 24 * outputScale)
}

export const shadowImprintTemplate: TemplateDefinition = {
  id: 'shadow-imprint',
  name: '光影印记',
  description: '柔焦背景搭配底部水印，Logo+型号在上，参数在下。',
  controls: {
    logoStyle: true,
    metaFields: ['logo', 'device', 'params'],
    borderWidth: true,
    adjustments: [
      {
        id: 'cornerRadius',
        label: '圆角大小',
        min: 0,
        max: 64,
        step: 2,
        defaultValue: 16,
        unit: 'px',
      },
      {
        id: 'blurIntensity',
        label: '模糊强度',
        min: 0,
        max: 72,
        step: 2,
        defaultValue: 36,
        unit: 'px',
      },
    ],
  },
  getCanvasWidth: (image, { borderWidth, outputScale = 1 }) => {
    const margin = Math.round(borderWidth * outputScale * (92 / 132))
    return image.naturalWidth + margin * 2
  },
  drawExport,
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
  context.fillStyle = 'rgba(0, 0, 0, 0.52)'
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
