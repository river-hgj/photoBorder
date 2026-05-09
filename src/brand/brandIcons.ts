import type { PhotoMeta } from '../types'
import { cameraLogoCatalog } from './cameraLogoCatalog'

function findIconInText(value: string, exact = false) {
  const source = value.trim().toLowerCase()

  if (!source) return undefined

  return cameraLogoCatalog.find((entry) =>
    [entry.name, ...entry.aliases].some((name) => {
      const normalizedName = name.toLowerCase()
      return exact ? source === normalizedName : source.includes(normalizedName)
    }),
  )
}

export function findBrandIcon(meta: PhotoMeta) {
  if (meta.logo.trim()) {
    return findIconInText(meta.logo, true) ?? findIconInText(meta.logo)
  }

  return findIconInText(meta.maker, true) ?? findIconInText(`${meta.maker} ${meta.device}`)
}
