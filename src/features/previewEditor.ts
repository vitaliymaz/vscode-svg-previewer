import * as vscode from 'vscode'
import * as path from 'path'

import TelemetryReporter from 'vscode-extension-telemetry'

import { IMessage, updatePreview, activeColorThemeChanged } from '../webViewMessaging'

import {
  TELEMETRY_EVENT_SHOW_PREVIEW_EDITOR,
  TELEMETRY_EVENT_TOGGLE_BOUNDING_BOX,
  TELEMETRY_EVENT_TOGGLE_TRANSPARENCY_GRID
} from '../telemetry/events'

export class PreviewEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'svgPreviewer.customEditor';

  public static register (extensionPath: string, telemetryReporter: TelemetryReporter): vscode.Disposable {
    const provider = new PreviewEditorProvider(extensionPath, telemetryReporter)

    return vscode.window.registerCustomEditorProvider(PreviewEditorProvider.viewType, provider)
  }

  constructor (
    private readonly extensionPath: string,
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
    webviewPanel.webview.html = this.getHtml(webviewPanel)

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
    const showBoundingBox = <boolean>vscode.workspace.getConfiguration('svg').get('preview.boundingBox')
    const showTransparencyGrid = <boolean>vscode.workspace.getConfiguration('svg').get('preview.transparencyGrid')

    return updatePreview({
      uri: uri.toString(),
      data: document.getText(),
      settings: { showBoundingBox, showTransparencyGrid }
    })
  }

  private getHtml (webviewPanel: vscode.WebviewPanel) {
    const webview = webviewPanel.webview

    const basePath = vscode.Uri.file(path.join(this.extensionPath, 'media'))
    const cssPath = vscode.Uri.file(path.join(this.extensionPath, 'media', 'styles', 'styles.css'))
    const jsPath = vscode.Uri.file(path.join(this.extensionPath, 'media', 'index.js'))

    const base = `<base href="${webview.asWebviewUri(basePath)}">`
    const securityPolicy = `
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src ${webview.cspSource}; img-src ${webview.cspSource} data:; script-src ${webview.cspSource}; style-src ${webview.cspSource};"
        />
    `
    const css = `<link rel="stylesheet" type="text/css" href="${webview.asWebviewUri(cssPath)}">`
    const scripts = `<script type="text/javascript" src="${webview.asWebviewUri(jsPath)}"></script>`
    return `<!DOCTYPE html><html><head>${base}${securityPolicy}${css}</head><body>${scripts}</body></html>`
  }
}
