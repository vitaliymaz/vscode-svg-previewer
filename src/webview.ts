import * as vscode from 'vscode'
import TelemetryReporter from 'vscode-extension-telemetry'

import { TELEMETRY_EVENT_TOGGLE_BOUNDING_BOX, TELEMETRY_EVENT_TOGGLE_TRANSPARENCY_GRID } from './telemetry/events'
import { getSvgDimension, getUriBinarySize, getUriText, humanFileSize, extensionResource, getHash, resourcePath, escapeAttribute } from './utils';

export interface IMessage {
    command: string;
    payload: any;
}

export function getPreviewPayloadSettings() {
  const config = vscode.workspace.getConfiguration('svg.preview')
  const showBoundingBox = <boolean>config.get('boundingBox')
  const showTransparencyGrid = <boolean>config.get('transparencyGrid')
  return { showBoundingBox, showTransparencyGrid }
}

export async function getPreviewPayloadData(uri: vscode.Uri) {
  const text = await getUriText(uri)
  const size = await getUriBinarySize(uri)

  const dimension = text ? getSvgDimension(text) : null
  const filesize = text ? humanFileSize(size) : null

  return { dimension, filesize }
}

export async function previewUpdatedEvent (uri: vscode.Uri) : Promise<IMessage> {
  return {
    command: 'source:update',
    payload: {
      uri: uri.toString(),
      data: await getPreviewPayloadData(uri),
      settings: getPreviewPayloadSettings()
    }
  }
}

export function activeColorThemeChangedEvent () : IMessage {
  return { command: 'theme:changed', payload: null }
}

export function webviewMessageReciever (telemetryReporter: TelemetryReporter, message: IMessage) : void {
  if (message.command === 'sendTelemetryEvent') {
    telemetryReporter.sendTelemetryEvent(message.payload.eventName, message.payload.properties)
  }
  if (message.command === 'changeBoundingBoxVisibility') {
    vscode.workspace.getConfiguration('svg').update('preview.boundingBox', message.payload.visible, true)
    telemetryReporter.sendTelemetryEvent(TELEMETRY_EVENT_TOGGLE_BOUNDING_BOX, { visible: message.payload.visible })
  }
  if (message.command === 'changeTransparencyGridVisibility') {
    vscode.workspace.getConfiguration('svg').update('preview.transparencyGrid', message.payload.visible, true)
    telemetryReporter.sendTelemetryEvent(TELEMETRY_EVENT_TOGGLE_TRANSPARENCY_GRID, { visible: message.payload.visible })
  }
}

export async function getWebviewContents(webviewEditor: vscode.WebviewPanel, resource: vscode.Uri, extensionUri: vscode.Uri) {
  const webview = webviewEditor.webview

  const hash = getHash()
  const version = Date.now().toString()

  const basePath = extensionResource(webviewEditor, extensionUri, '/media')
  const cssPath =  extensionResource(webviewEditor, extensionUri, '/media/styles/styles.css')
  const jsPath =  extensionResource(webviewEditor, extensionUri, '/media/index.js')

  const source = await resourcePath(webviewEditor, resource, version)

  const base = `<base href="${escapeAttribute(basePath)}">`
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: ${webview.cspSource}; script-src 'nonce-${hash}'; style-src ${webview.cspSource} 'nonce-${hash}';">`
  const metadata = `<meta id="svg-previewer-resource" data-src="${escapeAttribute(source)}">`
  const css = `<link rel="stylesheet" type="text/css" href="${escapeAttribute(cssPath)}" nonce="${hash}">`
  const scripts = `<script type="text/javascript" src="${escapeAttribute(jsPath)}" nonce="${hash}"></script>`

  return `<!DOCTYPE html><html><head>${base}${csp}${css}${metadata}</head><body>${scripts}</body></html>`
}
