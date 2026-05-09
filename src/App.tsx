import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { findBrandIcon } from './brand/brandIcons'
import { CanvasPreview } from './components/CanvasPreview'
import { brandOptions } from './data/brandOptions'
import { defaultMeta } from './data/defaults'
import { readableBrandColor } from './lib/color'
import { parseExif } from './lib/exif'
import { addExifToJpeg } from './lib/exifWriter'
import { loadImage } from './lib/image'
import { templates } from './templates'
import type { BrandLogoImages, BrandLogoSource, PhotoMeta, TemplateId } from './types'
import './App.css'

type PhotoItem = {
  id: string
  url: string
  fileName: string
  file: File
  meta: PhotoMeta
  originalMeta: PhotoMeta
}

function App() {
  const [template, setTemplate] = useState<TemplateId>('white-bottom')
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [selectedPhotoId, setSelectedPhotoId] = useState('')
  const [borderWidth, setBorderWidth] = useState(88)
  const [previewImage, setPreviewImage] = useState<HTMLImageElement | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState('')
  const [selectedLogoAssetIds, setSelectedLogoAssetIds] = useState<Record<string, string>>({})
  const [brandLogoScales, setBrandLogoScales] = useState<Record<string, number>>({})
  const [brandLogoImages, setBrandLogoImages] = useState<BrandLogoImages>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const photosRef = useRef<PhotoItem[]>([])

  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === selectedPhotoId) ?? photos[0],
    [photos, selectedPhotoId],
  )
  const meta = selectedPhoto?.meta ?? defaultMeta

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url))
    }
  }, [])

  useEffect(() => {
    if (!selectedPhoto?.url) {
      return
    }

    let isCurrent = true

    loadImage(selectedPhoto.url)
      .then((image) => {
        if (isCurrent) setPreviewImage(image)
      })
      .catch(() => {
        if (isCurrent) setPreviewImage(null)
      })

    return () => {
      isCurrent = false
    }
  }, [selectedPhoto?.url])

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === template) ?? templates[0],
    [template],
  )
  const brandLogoSource = useMemo(() => findBrandIcon(meta), [meta])

  useEffect(() => {
    let isCurrent = true

    loadBrandLogoImages(brandLogoSource)
      .then((images) => {
        if (isCurrent) setBrandLogoImages(images)
      })
      .catch(() => {
        if (isCurrent) setBrandLogoImages({})
      })

    return () => {
      isCurrent = false
    }
  }, [brandLogoSource])
  const selectedLogoAssetId = getSelectedLogoAssetId(brandLogoSource, selectedLogoAssetIds)
  const logoScale = getBrandLogoScale(brandLogoSource, brandLogoScales)

  const logo = useMemo(
    () => ({
      source: brandLogoSource,
      images: brandLogoImages,
      selectedAssetId: selectedLogoAssetId,
      scale: logoScale,
      brandColor: brandLogoSource?.brandColor,
      lightSurfaceColor: readableBrandColor(brandLogoSource?.brandColor),
    }),
    [brandLogoImages, brandLogoSource, logoScale, selectedLogoAssetId],
  )
  const templateRenderProps = useMemo(
    () => ({ meta, logo, borderWidth }),
    [borderWidth, logo, meta],
  )

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])

    if (!files.length) return

    const nextPhotos = await Promise.all(
      files.map(async (file, index) => {
        const parsedMeta = await parseExif(file)

        return {
          id: `${file.name}-${file.lastModified}-${file.size}-${index}`,
          url: URL.createObjectURL(file),
          fileName: file.name,
          file,
          meta: parsedMeta,
          originalMeta: parsedMeta,
        }
      }),
    )

    setPhotos((currentPhotos) => {
      currentPhotos.forEach((photo) => URL.revokeObjectURL(photo.url))
      return nextPhotos
    })
    setSelectedPhotoId(nextPhotos[0]?.id ?? '')
    setPreviewImage(null)
    event.target.value = ''
  }

  function updateSelectedPhoto(updater: (photo: PhotoItem) => PhotoItem) {
    if (!selectedPhoto) return

    setPhotos((currentPhotos) =>
      currentPhotos.map((photo) => (photo.id === selectedPhoto.id ? updater(photo) : photo)),
    )
  }

  function updateMeta(key: keyof PhotoMeta, value: string) {
    updateSelectedPhoto((photo) => ({
      ...photo,
      meta: { ...photo.meta, [key]: value },
    }))
  }

  function selectBrand(value: string) {
    if (!value) return
    updateSelectedPhoto((photo) => ({
      ...photo,
      meta: { ...photo.meta, maker: value, logo: value },
    }))
  }

  function selectLogo(value: string) {
    if (!value) return
    updateSelectedPhoto((photo) => ({
      ...photo,
      meta: { ...photo.meta, logo: value },
    }))
  }

  function selectLogoAsset(assetId: string) {
    if (!brandLogoSource) return

    setSelectedLogoAssetIds((current) => ({
      ...current,
      [brandLogoSource.id]: assetId,
    }))
  }

  function updateLogoScale(value: number) {
    if (!brandLogoSource) return

    setBrandLogoScales((current) => ({
      ...current,
      [brandLogoSource.id]: value,
    }))
  }

  async function exportImage() {
    if (!selectedPhoto) return

    setIsExporting(true)
    setExportProgress('正在导出当前照片...')

    try {
      await exportPhoto(selectedPhoto)
    } finally {
      setIsExporting(false)
      setExportProgress('')
    }
  }

  async function exportAllImages() {
    if (!photos.length) return

    setIsExporting(true)

    try {
      for (const [index, photo] of photos.entries()) {
        setExportProgress(`正在导出 ${index + 1}/${photos.length}`)
        await exportPhoto(photo)
        await delay(180)
      }
    } finally {
      setIsExporting(false)
      setExportProgress('')
    }
  }

  async function exportPhoto(photo: PhotoItem) {
    const image = await loadImage(photo.url)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const photoBrandLogoSource = findBrandIcon(photo.meta)
    const photoLogo = {
      source: photoBrandLogoSource,
      images: await loadBrandLogoImages(photoBrandLogoSource),
      selectedAssetId: getSelectedLogoAssetId(photoBrandLogoSource, selectedLogoAssetIds),
      scale: getBrandLogoScale(photoBrandLogoSource, brandLogoScales),
      brandColor: photoBrandLogoSource?.brandColor,
      lightSurfaceColor: readableBrandColor(photoBrandLogoSource?.brandColor),
    }

    if (!context) return

    const outputScale = image.naturalWidth / 1600
    canvas.width = getExportCanvasWidth(image, template, borderWidth, outputScale)
    selectedTemplate.drawExport(context, image, {
      meta: photo.meta,
      logo: photoLogo,
      borderWidth,
      outputScale,
    })

    const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', 0.95)
    const outputBlob = await addExifToJpeg(
      jpegBlob,
      photo.file,
      photo.meta,
      hasMetaChanges(photo.meta, photo.originalMeta),
    )
    const outputUrl = URL.createObjectURL(outputBlob)
    const link = document.createElement('a')
    link.href = outputUrl
    link.download = `${photo.fileName.replace(/\.[^.]+$/, '') || 'photo-border'}-${template}.jpg`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(outputUrl), 0)
  }

  return (
    <main className="app-shell">
      <section className="workbench">
        <div className="preview-stage">
          {selectedPhoto && previewImage ? (
            <CanvasPreview
              image={previewImage}
              template={selectedTemplate}
              renderProps={templateRenderProps}
            />
          ) : (
            <div className="photo-output photo-output--empty">
              <button className="empty-upload" type="button" onClick={() => inputRef.current?.click()}>
                <span>选择照片</span>
                <strong>上传 JPEG 后会自动识别 EXIF 信息</strong>
              </button>
            </div>
          )}
        </div>

        <aside className="control-panel" aria-label="照片边框编辑">
          <div className="panel-header">
            <h1>Photo Border</h1>
            <p>为照片生成带设备信息的边框成片。</p>
          </div>

          <label className="file-picker">
            <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFileChange} />
            <span>{photos.length ? '更换照片' : '上传照片'}</span>
            <small>
              {photos.length ? `${photos.length} 张照片，当前：${selectedPhoto?.fileName}` : '支持多选照片，JPEG 可读取拍摄参数'}
            </small>
          </label>

          {photos.length > 1 ? (
            <section className="control-group" aria-labelledby="batch-title">
              <h2 id="batch-title">照片队列</h2>
              <div className="photo-list">
                {photos.map((photo, index) => (
                  <button
                    className={`photo-list__item ${photo.id === selectedPhoto?.id ? 'photo-list__item--active' : ''}`}
                    type="button"
                    key={photo.id}
                    onClick={() => setSelectedPhotoId(photo.id)}
                  >
                    <span>{index + 1}</span>
                    <strong>{photo.fileName}</strong>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="control-group" aria-labelledby="template-title">
            <h2 id="template-title">边框模板</h2>
            <div className="template-list">
              {templates.map((item) => (
                <label
                  className={`template-card ${template === item.id ? 'template-card--active' : ''}`}
                  key={item.id}
                  style={{ backgroundImage: `url(${getTemplateExampleUrl(item.id)})` }}
                >
                  <input
                    type="radio"
                    name="template"
                    checked={template === item.id}
                    onChange={() => setTemplate(item.id)}
                  />
                  <span>{item.name}</span>
                  <small>{item.description}</small>
                </label>
              ))}
            </div>
          </section>

          <section className="control-group" aria-labelledby="logo-style-title">
            <h2 id="logo-style-title">品牌图标</h2>
            {brandLogoSource ? (
              <div className="logo-picker">
                {brandLogoSource.assets.map((asset) => (
                  <label
                    className={`logo-option ${selectedLogoAssetId === asset.id ? 'logo-option--active' : ''}`}
                    key={asset.id}
                  >
                    <input
                      type="radio"
                      name="logoAsset"
                      checked={selectedLogoAssetId === asset.id}
                      onChange={() => selectLogoAsset(asset.id)}
                    />
                    <span className="logo-option__preview">
                      <img src={asset.url} alt="" />
                    </span>
                    <span className="logo-option__label">{asset.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="control-note">当前 Logo 未匹配到可预览的品牌图标。</p>
            )}
            {brandLogoSource ? (
              <label className="range-field logo-scale-field">
                <span>大小缩放</span>
                <input
                  type="range"
                  min="0.4"
                  max="2"
                  step="0.05"
                  value={logoScale}
                  onChange={(event) => updateLogoScale(Number(event.target.value))}
                />
                <output>{logoScale.toFixed(2)}x</output>
              </label>
            ) : null}
          </section>

          <section className="control-group" aria-labelledby="meta-title">
            <h2 id="meta-title">边框文字</h2>
            <div className="field-grid">
              <label>
                Logo
                <select
                  value={brandOptions.includes(meta.logo) ? meta.logo : ''}
                  onChange={(event) => selectLogo(event.target.value)}
                >
                  <option value="">自定义 Logo</option>
                  {brandOptions.map((brand) => (
                    <option value={brand} key={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                <input value={meta.logo} onChange={(event) => updateMeta('logo', event.target.value)} />
              </label>
              <label>
                品牌
                <select
                  value={brandOptions.includes(meta.maker) ? meta.maker : ''}
                  onChange={(event) => selectBrand(event.target.value)}
                >
                  <option value="">自定义品牌</option>
                  {brandOptions.map((brand) => (
                    <option value={brand} key={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                <input value={meta.maker} onChange={(event) => updateMeta('maker', event.target.value)} />
              </label>
              <label>
                设备名称
                <input value={meta.device} onChange={(event) => updateMeta('device', event.target.value)} />
              </label>
              <label className="field-grid__wide">
                参数
                <input value={meta.params} onChange={(event) => updateMeta('params', event.target.value)} />
              </label>
              <label className="field-grid__wide">
                时间
                <input value={meta.date} onChange={(event) => updateMeta('date', event.target.value)} />
              </label>
            </div>
          </section>

          <section className="control-group" aria-labelledby="border-title">
            <h2 id="border-title">边框宽度</h2>
            <label className="range-field">
              <input
                type="range"
                min="80"
                max="220"
                step="4"
                value={borderWidth}
                onChange={(event) => setBorderWidth(Number(event.target.value))}
              />
              <span>{borderWidth}px</span>
            </label>
          </section>

          <div className="export-actions">
            <button className="export-button" type="button" disabled={!selectedPhoto || isExporting} onClick={exportImage}>
              {isExporting ? exportProgress || '正在生成...' : `导出当前${selectedTemplate.name}`}
            </button>
            <button className="export-button export-button--secondary" type="button" disabled={!photos.length || isExporting} onClick={exportAllImages}>
              批量导出全部
            </button>
          </div>
        </aside>
      </section>
    </main>
  )
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error('Failed to export canvas.'))
      },
      type,
      quality,
    )
  })
}

function hasMetaChanges(current: PhotoMeta, original: PhotoMeta) {
  return (
    current.maker !== original.maker ||
    current.device !== original.device ||
    current.params !== original.params ||
    current.date !== original.date
  )
}

async function loadBrandLogoImages(source: BrandLogoSource | undefined) {
  if (!source) return {}

  const entries = await Promise.all(
    source.assets.map(async (asset) => {
      try {
        return [asset.id, await loadImage(asset.url)] as const
      } catch {
        return undefined
      }
    }),
  )

  return Object.fromEntries(entries.filter((entry) => entry !== undefined)) as BrandLogoImages
}

function getSelectedLogoAssetId(source: BrandLogoSource | undefined, selectedLogoAssetIds: Record<string, string>) {
  if (!source) return undefined

  const selectedAssetId = selectedLogoAssetIds[source.id]
  return source.assets.some((asset) => asset.id === selectedAssetId) ? selectedAssetId : source.assets[0]?.id
}

function getBrandLogoScale(source: BrandLogoSource | undefined, brandLogoScales: Record<string, number>) {
  if (!source) return 1

  return brandLogoScales[source.id] ?? source.scale
}

function getTemplateExampleUrl(templateId: TemplateId) {
  return `/example/example-${templateId}.jpg`
}

function getExportCanvasWidth(
  image: HTMLImageElement,
  template: TemplateId,
  borderWidth: number,
  outputScale: number,
) {
  if (template === 'blur-frame') {
    const margin = Math.round(borderWidth * outputScale * (92 / 132))
    return image.naturalWidth + margin * 2
  }

  return image.naturalWidth
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export default App
