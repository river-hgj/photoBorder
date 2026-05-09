import type { SimpleIcon } from 'simple-icons'

export type TemplateId = 'blur-frame' | 'white-bottom'

export type PhotoMeta = {
  logo: string
  maker: string
  device: string
  params: string
  date: string
}

export type BrandLogoData = {
  icon?: SimpleIcon
  brandColor?: string
  lightSurfaceColor?: string
}

export type TemplateRenderProps = {
  meta: PhotoMeta
  logo: BrandLogoData
  borderWidth: number
}

export type TemplateDefinition = {
  id: TemplateId
  name: string
  description: string
  drawExport: (
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    props: TemplateRenderProps,
  ) => void
}
