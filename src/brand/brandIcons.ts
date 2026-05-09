import {
  siApple,
  siAsus,
  siBlackmagicdesign,
  siDji,
  siFujifilm,
  siGoogle,
  siHonor,
  siHuawei,
  siInsta360,
  siKodak,
  siLeica,
  siLenovo,
  siMeizu,
  siMotorola,
  siNikon,
  siOneplus,
  siOppo,
  siPanasonic,
  siSamsung,
  siSony,
  siVivo,
  siXiaomi,
} from 'simple-icons'
import type { SimpleIcon } from 'simple-icons'
import type { PhotoMeta } from '../types'

const brandIconEntries: Array<{
  icon: SimpleIcon
  names: string[]
}> = [
  { icon: siApple, names: ['apple', 'iphone', 'ipad'] },
  { icon: siSony, names: ['sony', 'alpha', 'a7', 'a9', 'zv-e', 'rx100'] },
  { icon: siNikon, names: ['nikon', 'z fc', 'z 5', 'z 6', 'z 7', 'z 8', 'z 9'] },
  { icon: siFujifilm, names: ['fujifilm', 'fuji', 'x-t', 'x100', 'gfx'] },
  { icon: siLeica, names: ['leica', 'summilux', 'summicron'] },
  { icon: siPanasonic, names: ['panasonic', 'lumix', 'gh6', 's5m2'] },
  { icon: siDji, names: ['dji', 'osmo', 'mavic', 'pocket'] },
  { icon: siBlackmagicdesign, names: ['blackmagic', 'bmpcc', 'ursa'] },
  { icon: siInsta360, names: ['insta360'] },
  { icon: siKodak, names: ['kodak'] },
  { icon: siSamsung, names: ['samsung', 'galaxy'] },
  { icon: siHuawei, names: ['huawei', 'mate', 'pura'] },
  { icon: siXiaomi, names: ['xiaomi', 'redmi'] },
  { icon: siOppo, names: ['oppo', 'find x', 'reno'] },
  { icon: siVivo, names: ['vivo', 'iqoo'] },
  { icon: siOneplus, names: ['oneplus', 'one plus'] },
  { icon: siHonor, names: ['honor'] },
  { icon: siGoogle, names: ['google', 'pixel'] },
  { icon: siMotorola, names: ['motorola', 'moto'] },
  { icon: siAsus, names: ['asus', 'rog phone', 'zenfone'] },
  { icon: siLenovo, names: ['lenovo'] },
  { icon: siMeizu, names: ['meizu'] },
]

function findIconInText(value: string, exact = false) {
  const source = value.trim().toLowerCase()

  if (!source) return undefined

  return brandIconEntries.find((entry) =>
    entry.names.some((name) => (exact ? source === name : source.includes(name))),
  )?.icon
}

export function findBrandIcon(meta: PhotoMeta) {
  if (meta.logo.trim()) {
    return findIconInText(meta.logo, true) ?? findIconInText(meta.logo)
  }

  return findIconInText(meta.maker, true) ?? findIconInText(`${meta.maker} ${meta.device}`)
}
