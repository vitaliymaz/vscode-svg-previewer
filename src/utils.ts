import * as vscode from 'vscode'

const NEW_LINE_REGEXP = /[\r\n]+/g
const SVG_TAG_REGEXP = /<svg.+?>/
const WIDTH_REGEXP = /width=("|')([0-9.,]+)\w*("|')/
const HEIGHT_REGEXP = /height=("|')([0-9.,]+)\w*("|')/

export interface IDimension {
  width: number;
  height: number;
}

export function isSvgUri (uri: vscode.Uri) {
  return uri.path.endsWith('.svg')
}

export function getOriginalDimension (data: string): IDimension | null {
  const formatted = data.replace(NEW_LINE_REGEXP, ' ')
  const svg = formatted.match(SVG_TAG_REGEXP)
  let width = null; let height = null
  if (svg && svg.length) {
    width = svg[0].match(WIDTH_REGEXP) ? svg[0].match(WIDTH_REGEXP)![2] : null
    height = svg[0].match(HEIGHT_REGEXP) ? svg[0].match(HEIGHT_REGEXP)![2] : null
  }
  return width && height ? { width: parseFloat(width), height: parseFloat(width) } : null
};

export function getByteCountByContent (s: string = ''): number {
  let count = 0; const stringLength = s.length; let i
  s = String(s || '')
  for (i = 0; i < stringLength; i++) {
    const partCount = encodeURI(s[i]).split('%').length
    count += partCount === 1 ? 1 : partCount - 1
  }
  return count
};

export function humanFileSize (size: number = 0): string {
  var i = Math.floor(Math.log(size) / Math.log(1024))
  const numberPart = +(size / Math.pow(1024, i)).toFixed(2) * 1
  const stringPart = ['B', 'kB', 'MB', 'GB', 'TB'][i]
  return `${numberPart} ${stringPart}`
};

export function escapeAttribute (value: string | vscode.Uri): string {
	return value.toString().replace(/"/g, "&quot;");
};

export function getHash () {
	let text = '';
	const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 64; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};
