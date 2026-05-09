export function readableBrandColor(color?: string) {
  if (!color || !/^#[0-9a-f]{6}$/i.test(color)) return color

  const red = Number.parseInt(color.slice(1, 3), 16)
  const green = Number.parseInt(color.slice(3, 5), 16)
  const blue = Number.parseInt(color.slice(5, 7), 16)
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
  const maxChannel = Math.max(red, green, blue)
  const minChannel = Math.min(red, green, blue)
  const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel
  const isNearWhite = minChannel > 235
  const isPaleNeutral = luminance > 0.9 && saturation < 0.18

  return isNearWhite || isPaleNeutral ? '#111317' : color
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
