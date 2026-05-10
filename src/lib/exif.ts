import exifr from 'exifr'

import { defaultMeta } from '../data/defaults'
import type { PhotoMeta } from '../types'

type ExifTags = Record<string, unknown>

const EXIF_FIELDS = [
  'Make',
  'Model',
  'FocalLength',
  'FocalLengthIn35mmFormat',
  'FNumber',
  'ExposureTime',
  'ISO',
  'ISOSpeedRatings',
  'PhotographicSensitivity',
  'DateTime',
  'DateTimeOriginal',
  'CreateDate',
]

function firstValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value
}

function stringFromExif(value: unknown) {
  const normalized = firstValue(value)

  if (typeof normalized === 'string') return normalized.trim()
  if (typeof normalized === 'number' && Number.isFinite(normalized)) return String(normalized)

  return ''
}

function numberFromExif(value: unknown) {
  const normalized = firstValue(value)

  if (typeof normalized === 'number') return Number.isFinite(normalized) ? normalized : undefined
  if (typeof normalized !== 'string') return undefined

  const trimmed = normalized.trim()
  const fractionMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/)

  if (fractionMatch) {
    const numerator = Number(fractionMatch[1])
    const denominator = Number(fractionMatch[2])
    return denominator ? numerator / denominator : undefined
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0')
}

function normalizeDate(value: unknown) {
  const normalized = firstValue(value)

  if (normalized instanceof Date && !Number.isNaN(normalized.getTime())) {
    const year = normalized.getFullYear()
    const month = padDatePart(normalized.getMonth() + 1)
    const day = padDatePart(normalized.getDate())
    const hours = padDatePart(normalized.getHours())
    const minutes = padDatePart(normalized.getMinutes())
    const seconds = padDatePart(normalized.getSeconds())

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  if (typeof normalized !== 'string' || !normalized.trim()) return defaultMeta.date

  return normalized.trim().replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
}

function formatExposure(value: unknown) {
  const exposure = numberFromExif(value)

  if (!exposure || !Number.isFinite(exposure)) return ''

  if (exposure < 1) {
    const denominator = Math.round(1 / exposure)
    return `1/${denominator}s`
  }

  return `${Math.round(exposure * 10) / 10}s`
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

function buildParams(tags: ExifTags) {
  const focal =
    numberFromExif(tags.FocalLengthIn35mmFormat) ?? numberFromExif(tags.FocalLength)
  const fNumber = numberFromExif(tags.FNumber)
  const iso =
    numberFromExif(tags.ISO) ??
    numberFromExif(tags.ISOSpeedRatings) ??
    numberFromExif(tags.PhotographicSensitivity)

  return [
    focal ? `${Math.round(focal)}mm` : '',
    fNumber ? `F${fNumber.toFixed(2)}` : '',
    formatExposure(tags.ExposureTime),
    iso ? `ISO${Math.round(iso)}` : '',
  ]
    .filter(Boolean)
    .join('  ')
}

export async function parseExif(file: File): Promise<PhotoMeta> {
  try {
    const tags = (await exifr.parse(file, {
      pick: EXIF_FIELDS,
      tiff: true,
      exif: true,
      gps: false,
      xmp: false,
      icc: false,
      iptc: false,
      jfif: false,
      ihdr: false,
      mergeOutput: true,
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
    })) as ExifTags | undefined

    if (!tags) return defaultMeta

    const maker = stringFromExif(tags.Make) || defaultMeta.maker
    const model = stringFromExif(tags.Model) || defaultMeta.device
    const params = buildParams(tags) || defaultMeta.params
    const date = normalizeDate(tags.DateTimeOriginal ?? tags.CreateDate ?? tags.DateTime)

    return {
      logo: brandFromMake(maker),
      maker,
      device: model,
      params,
      date,
    }
  } catch (error) {
    console.warn('Failed to parse EXIF metadata', error)
    return defaultMeta
  }
}
