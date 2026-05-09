import { drawCanvasBrandLogo } from '../brand/drawBrandLogo'
import type { TemplateDefinition, TemplateRenderProps } from '../types'

function drawExport(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  { meta, logo, borderWidth, outputScale = 1 }: TemplateRenderProps,
) {
  const canvas = context.canvas
  const photoHeight = Math.round((canvas.width / image.naturalWidth) * image.naturalHeight)
  const panelHeight = Math.round(borderWidth * outputScale * (220 / 132))
  canvas.height = photoHeight + panelHeight

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, photoHeight)
  context.fillRect(0, photoHeight, canvas.width, panelHeight)

  const panelCenterY = photoHeight + panelHeight / 2
  const primaryTextY = panelCenterY - 14 * outputScale
  const secondaryTextY = panelCenterY + 43 * outputScale
  const logoSize = 78 * outputScale

  context.fillStyle = '#101114'
  context.font = `700 ${46 * outputScale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  context.textAlign = 'left'
  context.fillText(meta.maker || meta.logo, 64 * outputScale, primaryTextY)

  context.fillStyle = '#8a8d94'
  context.font = `400 ${26 * outputScale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  context.fillText(meta.device, 64 * outputScale, secondaryTextY)

  const centerLogoColor =
    logo.lightSurfaceColor ?? (meta.logo.toLowerCase().includes('canon') ? '#c31322' : '#111317')

  drawCanvasBrandLogo(
    context,
    logo,
    meta.logo,
    canvas.width * 0.64,
    panelCenterY - logoSize / 2,
    logoSize,
    'right',
    centerLogoColor,
    `700 ${44 * outputScale}px Georgia, serif`,
  )

  context.strokeStyle = '#eceef2'
  context.lineWidth = outputScale
  context.beginPath()
  context.moveTo(canvas.width * 0.66, panelCenterY - panelHeight * 0.29)
  context.lineTo(canvas.width * 0.66, panelCenterY + panelHeight * 0.29)
  context.stroke()

  context.fillStyle = '#16171b'
  context.font = `700 ${34 * outputScale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  context.textAlign = 'left'
  context.fillText(meta.params, canvas.width * 0.69, primaryTextY)

  context.fillStyle = '#8a8d94'
  context.font = `400 ${28 * outputScale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  context.fillText(meta.date, canvas.width * 0.69, secondaryTextY)
}

export const whiteBottomTemplate: TemplateDefinition = {
  id: 'white-bottom',
  name: '纯白铭牌',
  description: '适合旅行、街拍和明亮照片，信息分区更清晰。',
  controls: {
    logoStyle: true,
    metaFields: ['logo', 'maker', 'device', 'params', 'date'],
    borderWidth: true,
  },
  drawExport,
}
