import type { SimpleIcon } from 'simple-icons'

export function drawCanvasBrandLogo(
  context: CanvasRenderingContext2D,
  icon: SimpleIcon | undefined,
  label: string,
  x: number,
  y: number,
  size: number,
  align: CanvasTextAlign,
  color: string,
  font: string,
) {
  context.fillStyle = color

  if (!icon) {
    context.font = font
    context.textAlign = align
    context.fillText(label, x, y + size * 0.78)
    return
  }

  const path = new Path2D(icon.path)
  const left = align === 'center' ? x - size / 2 : align === 'right' ? x - size : x

  context.save()
  context.translate(left, y)
  context.scale(size / 24, size / 24)
  context.fill(path)
  context.restore()
}
