import { drawCanvasBrandLogo, measureCanvasBrandLogo } from '../brand/drawBrandLogo'
import { drawCoverImage } from '../lib/image'
import type { TemplateDefinition, TemplateRenderProps } from '../types'

function drawExport(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  { meta, logo, borderWidth }: TemplateRenderProps,
) {
  const canvas = context.canvas
  const margin = Math.round(borderWidth * (92 / 132))
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
  context.filter = 'blur(36px) brightness(0.48) saturate(1.1)'
  drawCoverImage(context, image, 0, 0, canvas.width, canvas.height)
  context.restore()

  const photoRadius = Math.round(borderWidth * (22 / 132))

  context.save()
  context.shadowColor = 'rgba(0, 0, 0, 0.42)'
  context.shadowBlur = Math.round(borderWidth * (26 / 132))
  context.shadowOffsetY = Math.round(borderWidth * (14 / 132))
  context.fillStyle = '#0c0f10'
  drawRoundedRect(context, photoRect.x, photoRect.y, photoRect.width, photoRect.height, photoRadius)
  context.fill()
  context.restore()

  context.save()
  drawRoundedRect(context, photoRect.x, photoRect.y, photoRect.width, photoRect.height, photoRadius)
  context.clip()
  context.drawImage(image, photoRect.x, photoRect.y, photoRect.width, photoRect.height)
  context.restore()

  const logoSize = 46
  const gap = 24
  const rowCenterY = photoRect.y + photoRect.height + margin / 2
  const logoFont = '700 42px Georgia, serif'
  const paramsFont = '400 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

  context.font = logoFont
  const logoWidth = measureCanvasBrandLogo(context, logo, meta.logo, logoSize, '#ffffff', logoFont)

  context.fillStyle = '#ffffff'
  context.font = paramsFont
  context.textAlign = 'left'

  const paramsWidth = context.measureText(meta.params).width
  const rowWidth = logoWidth + gap + paramsWidth
  const rowStartX = canvas.width / 2 - rowWidth / 2

  drawCanvasBrandLogo(
    context,
    logo,
    meta.logo,
    rowStartX,
    rowCenterY - logoSize / 2,
    logoSize,
    'left',
    '#ffffff',
    logoFont,
  )

  context.font = paramsFont
  context.fillStyle = '#ffffff'
  context.fillText(meta.params, rowStartX + logoWidth + gap, rowCenterY + 10)
}

export const blurFrameTemplate: TemplateDefinition = {
  id: 'blur-frame',
  name: '背景模糊四周边框',
  description: '适合电影感和暗色照片，底部水平显示白色品牌图标与参数。',
  drawExport,
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
