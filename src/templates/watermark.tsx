import { drawCanvasBrandLogo } from '../brand/drawBrandLogo'
import type { TemplateDefinition, TemplateRenderProps } from '../types'

function drawExport(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  { meta, logo, adjustments, outputScale = 1 }: TemplateRenderProps,
) {
  const canvas = context.canvas
  const photoHeight = Math.round((canvas.width / image.naturalWidth) * image.naturalHeight)
  canvas.height = photoHeight

  context.drawImage(image, 0, 0, canvas.width, photoHeight)

  const watermarkHeightRatio = adjustments.watermarkHeight ?? 15
  const watermarkHeight = Math.round(photoHeight * (watermarkHeightRatio / 100))
  const watermarkY = photoHeight - watermarkHeight

  const spacing = adjustments.spacing ?? 12
  const horizontalPosition = adjustments.horizontalPosition ?? 50
  const centerX = canvas.width * (horizontalPosition / 100)

  const logoSize = 48 * outputScale
  const watermarkCenterY = watermarkY + watermarkHeight / 2

  const logoColor = '#ffffff'

  const totalContentHeight = logoSize + spacing * outputScale + 20 * outputScale
  const startY = watermarkCenterY - totalContentHeight / 2

  const logoY = startY

  drawCanvasBrandLogo(
    context,
    logo,
    meta.logo || meta.maker,
    centerX,
    logoY,
    logoSize,
    'center',
    logoColor,
    `600 ${28 * outputScale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  )

  const paramsY = logoY + logoSize + spacing * outputScale
  context.fillStyle = 'rgba(255, 255, 255, 0.9)'
  context.font = `400 ${22 * outputScale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  context.textAlign = 'center'

  context.fillText(meta.params, centerX, paramsY)
}

export const watermarkTemplate: TemplateDefinition = {
  id: 'watermark',
  name: '水印叠加',
  description: '水印叠加在照片底部，Logo 在上参数在下，可调节高度、间距和位置。',
  controls: {
    logoStyle: true,
    metaFields: ['logo', 'params'],
    adjustments: [
      {
        id: 'watermarkHeight',
        label: '水印高度',
        min: 6,
        max: 35,
        step: 1,
        defaultValue: 15,
        unit: '%',
      },
      {
        id: 'spacing',
        label: 'Logo 与参数间距',
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 12,
        unit: 'px',
      },
      {
        id: 'horizontalPosition',
        label: '水平位置',
        min: 10,
        max: 90,
        step: 1,
        defaultValue: 50,
        unit: '%',
      },
    ],
  },
  drawExport,
}
