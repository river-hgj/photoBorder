import type { PhotoMeta } from '../types'

const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]

type CameraParams = {
  focalLength?: number
  fNumber?: number
  exposureTime?: number
  iso?: number
}

type IfdEntry = {
  tag: number
  type: number
  count: number
  value: Uint8Array
}

export async function addExifToJpeg(
  jpegBlob: Blob,
  sourceFile: File | null,
  meta: PhotoMeta,
  hasMetaChanges: boolean,
) {
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer())
  const exifBytes =
    hasMetaChanges || !sourceFile
      ? buildExifSegment(meta)
      : await extractExifSegment(sourceFile).then((segment) => segment ?? buildExifSegment(meta))

  const outputBytes = insertExifSegment(jpegBytes, exifBytes)
  const outputBuffer = new ArrayBuffer(outputBytes.byteLength)
  new Uint8Array(outputBuffer).set(outputBytes)

  return new Blob([outputBuffer], { type: 'image/jpeg' })
}

async function extractExifSegment(file: File) {
  if (!file.type.includes('jpeg') && !file.name.match(/\.jpe?g$/i)) {
    return undefined
  }

  const bytes = new Uint8Array(await file.arrayBuffer())

  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return undefined
  }

  let offset = 2

  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) break

    const marker = bytes[offset + 1]

    if (marker === 0xda || marker === 0xd9) break

    const segmentLength = (bytes[offset + 2] << 8) + bytes[offset + 3]
    const segmentEnd = offset + 2 + segmentLength

    if (marker === 0xe1 && hasExifHeader(bytes, offset + 4)) {
      return normalizeExifOrientation(bytes.slice(offset, segmentEnd))
    }

    offset = segmentEnd
  }

  return undefined
}

function normalizeExifOrientation(segment: Uint8Array) {
  const output = segment.slice()
  const view = new DataView(output.buffer, output.byteOffset, output.byteLength)
  const tiffStart = 10
  const byteOrder = view.getUint16(tiffStart, false)
  const littleEndian = byteOrder === 0x4949

  if (!littleEndian && byteOrder !== 0x4d4d) {
    return output
  }

  const ifd0Offset = view.getUint32(tiffStart + 4, littleEndian)
  const ifd0Start = tiffStart + ifd0Offset

  if (ifd0Start + 2 > output.length) {
    return output
  }

  const entryCount = view.getUint16(ifd0Start, littleEndian)

  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifd0Start + 2 + index * 12

    if (entryOffset + 12 > output.length) {
      break
    }

    const tag = view.getUint16(entryOffset, littleEndian)

    if (tag === 0x0112) {
      view.setUint16(entryOffset + 8, 1, littleEndian)
      break
    }
  }

  return output
}

function insertExifSegment(jpegBytes: Uint8Array, exifSegment: Uint8Array) {
  if (jpegBytes[0] !== 0xff || jpegBytes[1] !== 0xd8) {
    return jpegBytes
  }

  const output = new Uint8Array(jpegBytes.length + exifSegment.length)
  output.set(jpegBytes.slice(0, 2), 0)
  output.set(exifSegment, 2)
  output.set(jpegBytes.slice(2), 2 + exifSegment.length)

  return output
}

function hasExifHeader(bytes: Uint8Array, offset: number) {
  return EXIF_HEADER.every((value, index) => bytes[offset + index] === value)
}

function buildExifSegment(meta: PhotoMeta) {
  const params = parseCameraParams(meta.params)
  const dateTime = toExifDateTime(meta.date)
  const software = 'Photo Border'

  const ifd0BaseEntries: IfdEntry[] = [
    asciiEntry(0x010f, meta.maker),
    asciiEntry(0x0110, meta.device),
    shortEntry(0x0112, 1),
    asciiEntry(0x0131, software),
    asciiEntry(0x0132, dateTime),
  ]
  const exifEntries = [
    params.exposureTime ? rationalEntry(0x829a, params.exposureTime) : undefined,
    params.fNumber ? rationalEntry(0x829d, params.fNumber) : undefined,
    params.iso ? shortEntry(0x8827, params.iso) : undefined,
    asciiEntry(0x9003, dateTime),
    asciiEntry(0x9004, dateTime),
    params.focalLength ? shortEntry(0xa405, params.focalLength) : undefined,
  ].filter((entry): entry is IfdEntry => Boolean(entry))

  const ifd0EntryCount = ifd0BaseEntries.length + 1
  const ifd0Offset = 8
  const ifd0DataOffset = ifd0Offset + 2 + ifd0EntryCount * 12 + 4
  const ifd0ExtraLength = calculateExtraLength(ifd0BaseEntries)
  const exifIfdOffset = ifd0DataOffset + ifd0ExtraLength
  const ifd0Entries = [...ifd0BaseEntries, longEntry(0x8769, exifIfdOffset)]
  const exifIfdDataOffset = exifIfdOffset + 2 + exifEntries.length * 12 + 4
  const ifd0 = buildIfd(ifd0Entries, ifd0DataOffset)
  const exifIfd = buildIfd(exifEntries, exifIfdDataOffset)
  const tiffLength = 8 + ifd0.length + exifIfd.length
  const app1PayloadLength = EXIF_HEADER.length + tiffLength
  const segment = new Uint8Array(2 + 2 + app1PayloadLength)
  const view = new DataView(segment.buffer)

  segment[0] = 0xff
  segment[1] = 0xe1
  view.setUint16(2, app1PayloadLength + 2, false)
  segment.set(EXIF_HEADER, 4)

  const tiffStart = 4 + EXIF_HEADER.length
  segment[tiffStart] = 0x49
  segment[tiffStart + 1] = 0x49
  view.setUint16(tiffStart + 2, 0x002a, true)
  view.setUint32(tiffStart + 4, ifd0Offset, true)
  segment.set(ifd0, tiffStart + ifd0Offset)
  segment.set(exifIfd, tiffStart + exifIfdOffset)

  return segment
}

function buildIfd(entries: IfdEntry[], dataOffset: number) {
  const extraLength = calculateExtraLength(entries)
  const output = new Uint8Array(2 + entries.length * 12 + 4 + extraLength)
  const view = new DataView(output.buffer)
  let extraCursor = dataOffset
  let relativeExtraCursor = 2 + entries.length * 12 + 4

  view.setUint16(0, entries.length, true)

  entries
    .slice()
    .sort((left, right) => left.tag - right.tag)
    .forEach((entry, index) => {
      const offset = 2 + index * 12
      view.setUint16(offset, entry.tag, true)
      view.setUint16(offset + 2, entry.type, true)
      view.setUint32(offset + 4, entry.count, true)

      if (entry.value.length <= 4) {
        output.set(entry.value, offset + 8)
        return
      }

      view.setUint32(offset + 8, extraCursor, true)
      output.set(entry.value, relativeExtraCursor)
      extraCursor += entry.value.length
      relativeExtraCursor += entry.value.length
    })

  view.setUint32(2 + entries.length * 12, 0, true)

  return output
}

function calculateExtraLength(entries: IfdEntry[]) {
  return entries.reduce((total, entry) => total + (entry.value.length > 4 ? entry.value.length : 0), 0)
}

function asciiEntry(tag: number, value: string): IfdEntry {
  const bytes = new TextEncoder().encode(`${toAscii(value)}\0`)
  return { tag, type: 2, count: bytes.length, value: bytes }
}

function shortEntry(tag: number, value: number): IfdEntry {
  const bytes = new Uint8Array(2)
  new DataView(bytes.buffer).setUint16(0, Math.max(0, Math.round(value)), true)
  return { tag, type: 3, count: 1, value: bytes }
}

function longEntry(tag: number, value: number): IfdEntry {
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setUint32(0, value, true)
  return { tag, type: 4, count: 1, value: bytes }
}

function rationalEntry(tag: number, value: number): IfdEntry {
  const denominator = 10000
  const bytes = new Uint8Array(8)
  const view = new DataView(bytes.buffer)

  view.setUint32(0, Math.max(1, Math.round(value * denominator)), true)
  view.setUint32(4, denominator, true)

  return { tag, type: 5, count: 1, value: bytes }
}

function parseCameraParams(params: string): CameraParams {
  const focalLength = params.match(/(\d+(?:\.\d+)?)\s*mm/i)?.[1]
  const fNumber = params.match(/f\s*(\d+(?:\.\d+)?)/i)?.[1]
  const fractionExposure = params.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*s?/i)
  const decimalExposure = params.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*s(?:\s|$)/i)?.[1]
  const iso = params.match(/iso\s*(\d+)/i)?.[1]

  return {
    focalLength: toFiniteNumber(focalLength),
    fNumber: toFiniteNumber(fNumber),
    exposureTime: fractionExposure
      ? Number(fractionExposure[1]) / Number(fractionExposure[2])
      : toFiniteNumber(decimalExposure),
    iso: toFiniteNumber(iso),
  }
}

function toFiniteNumber(value?: string) {
  if (!value) return undefined

  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined
}

function toExifDateTime(value: string) {
  const normalized = value.trim().replace(/^(\d{4})-(\d{2})-(\d{2})/, '$1:$2:$3')

  return /^\d{4}:\d{2}:\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(normalized)
    ? normalized
    : '2026:05:09 00:00:00'
}

function toAscii(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '')
    .trim()
}
