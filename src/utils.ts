import * as vscode from 'vscode'

const textDecoder = new TextDecoder('utf-8')

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

export function getResourceRoots(sourceUri: vscode.Uri, extensionUri: vscode.Uri) {
  return [
    isSvgUri(sourceUri) ? vscode.Uri.joinPath(sourceUri, '..') : sourceUri,
    vscode.Uri.joinPath(extensionUri, 'media')
  ]
}

export async function getUriText(uri: vscode.Uri) {
  try {
    const buffer = await vscode.workspace.fs.readFile(uri)
    return textDecoder.decode(buffer)
  } catch(_) {
    return '';
  }
}

export async function getUriBinarySize(uri: vscode.Uri) {
  try {
    const stat = await vscode.workspace.fs.stat(uri)
    return stat.size
  } catch(_) {
    return 0
  }
}

export function getSvgDimension (text: string): IDimension | null {
  const formatted = text.replace(NEW_LINE_REGEXP, ' ')
  const svg = formatted.match(SVG_TAG_REGEXP)
  let width = null; let height = null
  if (svg && svg.length) {
    width = svg[0].match(WIDTH_REGEXP) ? svg[0].match(WIDTH_REGEXP)![2] : null
    height = svg[0].match(HEIGHT_REGEXP) ? svg[0].match(HEIGHT_REGEXP)![2] : null
  }
  return width && height ? { width: parseFloat(width), height: parseFloat(height) } : null
}

export function humanFileSize (size: number = 0): string {
  var i = Math.floor(Math.log(size) / Math.log(1024))
  const numberPart = +(size / Math.pow(1024, i)).toFixed(2) * 1
  const stringPart = ['B', 'kB', 'MB', 'GB', 'TB'][i]
  return `${numberPart} ${stringPart}`
}

export async function getWebviewContents(webviewEditor: vscode.WebviewPanel, resource: vscode.Uri, extensionUri: vscode.Uri) {
  const webview = webviewEditor.webview

  const hash = getHash()
  const version = Date.now().toString();

  const basePath = extensionResource(webviewEditor, extensionUri, '/media')
  const cssPath =  extensionResource(webviewEditor, extensionUri, '/media/styles/styles.css')
  const jsPath =  extensionResource(webviewEditor, extensionUri, '/media/index.js')

  const source = await resourcePath(webviewEditor, resource, version);

  const base = `<base href="${escapeAttribute(basePath)}">`
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: ${webview.cspSource}; script-src 'nonce-${hash}'; style-src ${webview.cspSource} 'nonce-${hash}';">`
  const metadata = `<meta id="svg-previewer-resource" data-src="${escapeAttribute(source)}">`
  const css = `<link rel="stylesheet" type="text/css" href="${escapeAttribute(cssPath)}" nonce="${hash}">`
  const scripts = `<script type="text/javascript" src="${escapeAttribute(jsPath)}" nonce="${hash}"></script>`

  return `<!DOCTYPE html><html><head>${base}${csp}${css}${metadata}</head><body>${scripts}</body></html>`
}

export async function resourcePath (webviewEditor: vscode.WebviewPanel, resource: vscode.Uri, version: string): Promise<string> {
  if (resource.scheme === "git" && await getUriBinarySize(resource) === 0) {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMSIgd2lkdGg9IjEiPjwvc3ZnPg==';
  }
  const webviewUri = webviewEditor.webview.asWebviewUri(resource)
  // Avoid adding cache busting if there is already a query string
  if (resource.query) return webviewUri.toString();
  else return webviewUri.with({ query: `version=${version}` }).toString();
}

export function extensionResource (webviewEditor: vscode.WebviewPanel, extensionUri: vscode.Uri, path: string) {
  return webviewEditor.webview.asWebviewUri(extensionUri.with({
    path: extensionUri.path + path
  }));
}

export function escapeAttribute (value: string | vscode.Uri): string {
  return value.toString().replace(/"/g, "&quot;");
}

export function getHash () {
  let text = '';
  const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 64; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
