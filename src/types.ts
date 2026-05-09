export type TemplateId = 'blur-frame' | 'impression-frame' | 'white-bottom'

export type PhotoMeta = {
  logo: string
  maker: string
  device: string
  params: string
  date: string
}

export type BrandLogoAsset = {
  id: string
  label: string
  url: string
}

export type BrandLogoSource = {
  id: string
  name: string
  aliases: string[]
  scale: number
  assets: BrandLogoAsset[]
  brandColor?: string
}

export type BrandLogoImages = Record<string, HTMLImageElement>

export type BrandLogoData = {
  source?: BrandLogoSource
  images?: BrandLogoImages
  selectedAssetId?: string
  scale?: number
  brandColor?: string
  lightSurfaceColor?: string
}

export type TemplateRenderProps = {
  meta: PhotoMeta
  logo: BrandLogoData
  borderWidth: number
  adjustments: Record<string, number>
  outputScale?: number
}

export type TemplateAdjustmentControl = {
  id: string
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
  unit?: string
}

export type TemplateControls = {
  logoStyle?: boolean
  metaFields?: Array<keyof PhotoMeta>
  borderWidth?: boolean
  adjustments?: TemplateAdjustmentControl[]
}

export type TemplateDefinition = {
  id: TemplateId
  name: string
  description: string
  controls: TemplateControls
  getCanvasWidth?: (
    image: HTMLImageElement,
    props: Pick<TemplateRenderProps, 'adjustments' | 'borderWidth' | 'outputScale'>,
  ) => number
  drawExport: (
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    props: TemplateRenderProps,
  ) => void
}
