import * as vscode from 'vscode'

import TelemetryReporter from 'vscode-extension-telemetry'

import { IMessage, updatePreview, activeColorThemeChanged } from '../webViewMessaging'
import { getOriginalDimension, getByteCountByContent, humanFileSize, escapeAttribute, getHash } from '../utils'

import {
  TELEMETRY_EVENT_SHOW_PREVIEW_EDITOR,
  TELEMETRY_EVENT_TOGGLE_BOUNDING_BOX,
  TELEMETRY_EVENT_TOGGLE_TRANSPARENCY_GRID
} from '../telemetry/events'

export class PreviewEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'svgPreviewer.customEditor';

  constructor (
    private readonly extensionUri: vscode.Uri,
    private readonly telemetryReporter: TelemetryReporter
  ) { }

  public async resolveCustomTextEditor (
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    this.telemetryReporter.sendTelemetryEvent(TELEMETRY_EVENT_SHOW_PREVIEW_EDITOR)

    const update = async () => {
      const message = await this.getUpdateWebViewMessage(document.uri)

      webviewPanel.webview.postMessage(message)
    }

    webviewPanel.webview.options = { enableScripts: true }
    webviewPanel.webview.html = this.getHtml(webviewPanel, document.uri)

    await update()

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        update()
      }
    })

    const receiveMessageSubscription = webviewPanel.webview.onDidReceiveMessage(message => {
      if (message.command === 'sendTelemetryEvent') {
        this.telemetryReporter.sendTelemetryEvent(message.payload.eventName, message.payload.properties)
      }
      if (message.command === 'changeBoundingBoxVisibility') {
        vscode.workspace.getConfiguration('svg').update('preview.boundingBox', message.payload.visible, true)
        this.telemetryReporter.sendTelemetryEvent(TELEMETRY_EVENT_TOGGLE_BOUNDING_BOX, { visible: message.payload.visible })
      }
      if (message.command === 'changeTransparencyGridVisibility') {
        vscode.workspace.getConfiguration('svg').update('preview.transparencyGrid', message.payload.visible, true)
        this.telemetryReporter.sendTelemetryEvent(TELEMETRY_EVENT_TOGGLE_TRANSPARENCY_GRID, { visible: message.payload.visible })
      }
    })

    const changeThemeSubscription = vscode.window.onDidChangeActiveColorTheme(() => {
      webviewPanel.webview.postMessage(activeColorThemeChanged())
    })

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose()
      receiveMessageSubscription.dispose()
      changeThemeSubscription.dispose()
    })
  }

  private async getUpdateWebViewMessage (uri: vscode.Uri): Promise<IMessage> {
    const document = await vscode.workspace.openTextDocument(uri)
    const text = document.getText()
    const dimension = text ? getOriginalDimension(text) : null
    const filesize = text ? humanFileSize(getByteCountByContent(text)) : null
    const showBoundingBox = <boolean>vscode.workspace.getConfiguration('svg').get('preview.boundingBox')
    const showTransparencyGrid = <boolean>vscode.workspace.getConfiguration('svg').get('preview.transparencyGrid')

    return updatePreview({
      uri: uri.toString(),
      data: { dimension, filesize },
      settings: { showBoundingBox, showTransparencyGrid }
    })
  }

  private getHtml (webviewPanel: vscode.WebviewPanel, resource: vscode.Uri) {
    const webview = webviewPanel.webview

    const basePath = this.extensionResource(webviewPanel, '/media')
    const cssPath = this.extensionResource(webviewPanel, '/media/styles/styles.css')
    const jsPath = this.extensionResource(webviewPanel, '/media/index.js')

    const hash = getHash()
    const version = Date.now().toString();

    const source = this.getResourcePath(webviewPanel, resource, version);

    const base = `<base href="${escapeAttribute(basePath)}">`
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: ${webview.cspSource}; script-src 'nonce-${hash}'; style-src ${webview.cspSource} 'nonce-${hash}';">`
    const metadata = `<meta id="svg-previewer-resource" data-src="${escapeAttribute(source)}">`
    const css = `<link rel="stylesheet" type="text/css" href="${escapeAttribute(cssPath)}" nonce="${hash}">`
    const scripts = `<script type="text/javascript" src="${escapeAttribute(jsPath)}" nonce="${hash}"></script>`

    return `<!DOCTYPE html><html><head>${base}${csp}${css}${metadata}</head><body>${scripts}</body></html>`
  }

  private getResourcePath (webviewPanel: vscode.WebviewPanel, resource: vscode.Uri, version: string): string {
    // Avoid adding cache busting if there is already a query string
    if (resource.query) {
      return webviewPanel.webview.asWebviewUri(resource).toString();
    }
    return webviewPanel.webview.asWebviewUri(resource).with({ query: `version=${version}` }).toString();
  }

  private extensionResource (webviewPanel: vscode.WebviewPanel, path: string) {
    return webviewPanel.webview.asWebviewUri(this.extensionUri.with({
      path: this.extensionUri.path + path
    }));
  }
}
