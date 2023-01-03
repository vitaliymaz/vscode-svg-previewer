export type dimension = { width: number, height: number };

const NEW_LINE_REGEXP = /[\r\n]+/g
const SVG_TAG_REGEXP = /<svg.+?>/
const WIDTH_REGEXP = /width=("|')([0-9.,]+)\w*("|')/
const HEIGHT_REGEXP = /height=("|')([0-9.,]+)\w*("|')/

export function getOriginalDimension (data: string): dimension | null {
  const formatted = data.replace(NEW_LINE_REGEXP, ' ')
  const svg = formatted.match(SVG_TAG_REGEXP)
  let width = null; let height = null
  if (svg && svg.length) {
    width = svg[0].match(WIDTH_REGEXP) ? svg[0].match(WIDTH_REGEXP)![2] : null
    height = svg[0].match(HEIGHT_REGEXP) ? svg[0].match(HEIGHT_REGEXP)![2] : null
  }
  return width && height ? { width: parseFloat(width), height: parseFloat(width) } : null
}
