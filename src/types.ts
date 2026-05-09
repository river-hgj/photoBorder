export type TemplateId = 'blur-frame' | 'white-bottom'
export type LogoVariant = 'color' | 'mono'

export type PhotoMeta = {
  logo: string
  maker: string
  device: string
  params: string
  date: string
}

export type BrandLogoAssets = {
  color?: string
  black?: string
  white?: string
}

export type BrandLogoSource = {
  id: string
  name: string
  aliases: string[]
  assets: BrandLogoAssets
  brandColor?: string
}

export type BrandLogoImages = {
  color?: HTMLImageElement
  black?: HTMLImageElement
  white?: HTMLImageElement
}

export type BrandLogoData = {
  source?: BrandLogoSource
  images?: BrandLogoImages
  variant: LogoVariant
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
