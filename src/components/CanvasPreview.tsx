import { useEffect, useRef } from 'react'
import type { TemplateDefinition, TemplateRenderProps } from '../types'

type CanvasPreviewProps = {
  image: HTMLImageElement
  template: TemplateDefinition
  renderProps: TemplateRenderProps
}

export function CanvasPreview({ image, template, renderProps }: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context) return

    canvas.width = 1600
    template.drawExport(context, image, renderProps)
  }, [image, renderProps, template])

  return <canvas className="photo-output photo-output--canvas" ref={canvasRef} aria-label="照片边框预览" />
}
