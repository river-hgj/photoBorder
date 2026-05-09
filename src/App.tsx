import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { findBrandIcon } from './brand/brandIcons'
import { CanvasPreview } from './components/CanvasPreview'
import { brandOptions } from './data/brandOptions'
import { defaultMeta } from './data/defaults'
import { readableBrandColor } from './lib/color'
import { parseExif } from './lib/exif'
import { loadImage } from './lib/image'
import { templates } from './templates'
import type { PhotoMeta, TemplateId } from './types'
import './App.css'

function App() {
  const [template, setTemplate] = useState<TemplateId>('white-bottom')
  const [photoUrl, setPhotoUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [meta, setMeta] = useState<PhotoMeta>(defaultMeta)
  const [borderWidth, setBorderWidth] = useState(132)
  const [previewImage, setPreviewImage] = useState<HTMLImageElement | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  useEffect(() => {
    if (!photoUrl) {
      return
    }

    let isCurrent = true

    loadImage(photoUrl)
      .then((image) => {
        if (isCurrent) setPreviewImage(image)
      })
      .catch(() => {
        if (isCurrent) setPreviewImage(null)
      })

    return () => {
      isCurrent = false
    }
  }, [photoUrl])

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === template) ?? templates[0],
    [template],
  )
  const brandIcon = useMemo(() => findBrandIcon(meta), [meta])
  const logo = useMemo(
    () => ({
      icon: brandIcon,
      brandColor: brandIcon ? `#${brandIcon.hex}` : undefined,
      lightSurfaceColor: readableBrandColor(brandIcon ? `#${brandIcon.hex}` : undefined),
    }),
    [brandIcon],
  )
  const templateRenderProps = useMemo(
    () => ({ meta, logo, borderWidth }),
    [borderWidth, logo, meta],
  )

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    const nextUrl = URL.createObjectURL(file)
    setPhotoUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      return nextUrl
    })
    setFileName(file.name)
    setMeta(await parseExif(file))
  }

  function updateMeta(key: keyof PhotoMeta, value: string) {
    setMeta((current) => ({ ...current, [key]: value }))
  }

  function selectBrand(value: string) {
    if (!value) return
    setMeta((current) => ({ ...current, maker: value, logo: value }))
  }

  function selectLogo(value: string) {
    if (!value) return
    setMeta((current) => ({ ...current, logo: value }))
  }

  async function exportImage() {
    if (!photoUrl) return

    setIsExporting(true)

    try {
      const image = await loadImage(photoUrl)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (!context) return

      canvas.width = 1600
      selectedTemplate.drawExport(context, image, templateRenderProps)

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${fileName.replace(/\.[^.]+$/, '') || 'photo-border'}-${template}.png`
      link.click()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="workbench">
        <div className="preview-stage">
          {previewImage ? (
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
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} />
            <span>{photoUrl ? '更换照片' : '上传照片'}</span>
            <small>{fileName || '支持本地照片，JPEG 可读取拍摄参数'}</small>
          </label>

          <section className="control-group" aria-labelledby="template-title">
            <h2 id="template-title">边框模板</h2>
            <div className="template-list">
              {templates.map((item) => (
                <label
                  className={`template-card ${template === item.id ? 'template-card--active' : ''}`}
                  key={item.id}
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

          <button className="export-button" type="button" disabled={!photoUrl || isExporting} onClick={exportImage}>
            {isExporting ? '正在生成...' : `导出${selectedTemplate.name}`}
          </button>
        </aside>
      </section>
    </main>
  )
}

export default App
