import { drawCanvasBrandLogo } from '../brand/drawBrandLogo'
import { drawContainedImage, drawCoverImage } from '../lib/image'
import type { TemplateDefinition, TemplateRenderProps } from '../types'

function drawExport(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  { meta, logo, borderWidth }: TemplateRenderProps,
) {
  const canvas = context.canvas
  canvas.height = 1060

  context.fillStyle = '#101513'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.save()
  context.filter = 'blur(36px) brightness(0.48) saturate(1.1)'
  drawCoverImage(context, image, 0, 0, canvas.width, canvas.height)
  context.restore()

  const margin = Math.round(borderWidth * (92 / 132))
  const infoHeight = Math.round(borderWidth * (134 / 132))
  const photoWidth = canvas.width - margin * 2
  const photoHeight = canvas.height - margin * 2 - infoHeight

  drawContainedImage(context, image, margin, margin, photoWidth, photoHeight)

  context.fillStyle = 'rgba(10, 15, 14, 0.62)'
  context.fillRect(margin, margin + photoHeight, photoWidth, infoHeight)

  drawCanvasBrandLogo(
    context,
    logo.icon,
    meta.logo,
    canvas.width / 2 - 24,
    margin + photoHeight + infoHeight * 0.31,
    44,
    'right',
    logo.brandColor ?? '#f4f6f2',
    '700 42px Georgia, serif',
  )

  context.font = '500 32px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  context.textAlign = 'left'
  context.fillText(meta.device, canvas.width / 2 + 18, margin + photoHeight + infoHeight * 0.55)

  context.fillStyle = 'rgba(244, 246, 242, 0.82)'
  context.font = '400 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  context.textAlign = 'center'
  context.fillText(meta.params, canvas.width / 2, margin + photoHeight + infoHeight * 0.88)
}

export const blurFrameTemplate: TemplateDefinition = {
  id: 'blur-frame',
  name: '背景模糊四周边框',
  description: '适合电影感和暗色照片，底部居中显示品牌与参数。',
  drawExport,
}
