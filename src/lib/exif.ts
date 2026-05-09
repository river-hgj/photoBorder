import { defaultMeta } from '../data/defaults'
import type { PhotoMeta } from '../types'

function readAscii(view: DataView, offset: number, length: number) {
  let output = ''

  for (let index = 0; index < length; index += 1) {
    const value = view.getUint8(offset + index)
    if (value === 0) break
    output += String.fromCharCode(value)
  }

  return output.trim()
}

function formatRational(value?: number) {
  if (!value || !Number.isFinite(value)) return ''

  if (value < 1) {
    const denominator = Math.round(1 / value)
    return `1/${denominator}s`
  }

  return `${Math.round(value * 10) / 10}s`
}

function readExifValue(
  view: DataView,
  tiffStart: number,
  entryOffset: number,
  littleEndian: boolean,
) {
  const type = view.getUint16(entryOffset + 2, littleEndian)
  const count = view.getUint32(entryOffset + 4, littleEndian)
  const valueOffset = entryOffset + 8
  const typeSize: Record<number, number> = {
    1: 1,
    2: 1,
    3: 2,
    4: 4,
    5: 8,
    7: 1,
    9: 4,
    10: 8,
  }
  const bytes = (typeSize[type] ?? 1) * count
  const dataOffset =
    bytes <= 4 ? valueOffset : tiffStart + view.getUint32(valueOffset, littleEndian)

  if (dataOffset < 0 || dataOffset >= view.byteLength) return undefined

  if (type === 2) return readAscii(view, dataOffset, count)
  if (type === 3) return view.getUint16(dataOffset, littleEndian)
  if (type === 4) return view.getUint32(dataOffset, littleEndian)

  if (type === 5) {
    const numerator = view.getUint32(dataOffset, littleEndian)
    const denominator = view.getUint32(dataOffset + 4, littleEndian)
    return denominator ? numerator / denominator : undefined
  }

  return undefined
}

function collectIfdTags(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  littleEndian: boolean,
) {
  const tags = new Map<number, string | number>()
  const absoluteOffset = tiffStart + ifdOffset
  const count = view.getUint16(absoluteOffset, littleEndian)

  for (let index = 0; index < count; index += 1) {
    const entryOffset = absoluteOffset + 2 + index * 12
    const tag = view.getUint16(entryOffset, littleEndian)
    const value = readExifValue(view, tiffStart, entryOffset, littleEndian)

    if (value !== undefined) tags.set(tag, value)
  }

  return tags
}

function normalizeDate(value?: string | number) {
  if (!value || typeof value !== 'string') return defaultMeta.date
  return value.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
}

function brandFromMake(make?: string) {
  const normalized = make?.toLowerCase() ?? ''

  if (normalized.includes('canon')) return 'Canon'
  if (normalized.includes('sony')) return 'SONY'
  if (normalized.includes('nikon')) return 'Nikon'
  if (normalized.includes('fujifilm') || normalized.includes('fuji')) return 'FUJIFILM'
  if (normalized.includes('leica')) return 'Leica'
  if (normalized.includes('olympus')) return 'OM SYSTEM'
  if (normalized.includes('panasonic')) return 'LUMIX'

  return make?.trim() || defaultMeta.logo
}

export async function parseExif(file: File): Promise<PhotoMeta> {
  const buffer = await file.arrayBuffer()
  const view = new DataView(buffer)

  if (view.getUint16(0) !== 0xffd8) return defaultMeta

  let offset = 2

  while (offset < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break

    const marker = view.getUint8(offset + 1)
    const segmentLength = view.getUint16(offset + 2)

    if (marker === 0xe1 && readAscii(view, offset + 4, 6) === 'Exif') {
      const tiffStart = offset + 10
      const littleEndian = view.getUint16(tiffStart) === 0x4949
      const ifd0Offset = view.getUint32(tiffStart + 4, littleEndian)
      const ifd0 = collectIfdTags(view, tiffStart, ifd0Offset, littleEndian)
      const exifPointer = ifd0.get(0x8769)
      const exif =
        typeof exifPointer === 'number'
          ? collectIfdTags(view, tiffStart, exifPointer, littleEndian)
          : new Map<number, string | number>()

      const maker = String(ifd0.get(0x010f) ?? defaultMeta.maker).trim()
      const model = String(ifd0.get(0x0110) ?? defaultMeta.device).trim()
      const focal = Number(exif.get(0x920a))
      const fNumber = Number(exif.get(0x829d))
      const exposure = Number(exif.get(0x829a))
      const iso = Number(exif.get(0x8827))
      const params = [
        focal ? `${Math.round(focal)}mm` : '',
        fNumber ? `F${Math.round(fNumber * 10) / 10}` : '',
        formatRational(exposure),
        iso ? `ISO${iso}` : '',
      ]
        .filter(Boolean)
        .join('  ')

      return {
        logo: brandFromMake(maker),
        maker,
        device: model,
        params: params || defaultMeta.params,
        date: normalizeDate(ifd0.get(0x0132) ?? exif.get(0x9003)),
      }
    }

    offset += 2 + segmentLength
  }

  return defaultMeta
}
