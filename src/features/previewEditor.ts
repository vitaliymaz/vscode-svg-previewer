import * as vscode from 'vscode'
import TelemetryReporter from 'vscode-extension-telemetry'

import { activeColorThemeChangedEvent, previewUpdatedEvent, getWebviewContents, webviewMessageReciever } from '../webview'
import { getResourceRoots } from '../utils'
import { TELEMETRY_EVENT_SHOW_PREVIEW_EDITOR } from '../telemetry/events'

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
    await this.render(document, webviewPanel)
    await this.update(document, webviewPanel)

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        this.update(document, webviewPanel)
      }
    })

    const receiveMessageSubscription = webviewPanel.webview
      .onDidReceiveMessage(webviewMessageReciever.bind(null, this.telemetryReporter))

    const changeThemeSubscription = vscode.window.onDidChangeActiveColorTheme(() => {
      webviewPanel.webview.postMessage(activeColorThemeChangedEvent())
    })

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose()
      receiveMessageSubscription.dispose()
      changeThemeSubscription.dispose()
    })
  }

  async render(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: getResourceRoots(document.uri, this.extensionUri)
    }
    webviewPanel.webview.html = await getWebviewContents(webviewPanel, document.uri, this.extensionUri)
  }

  async update(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
    webviewPanel.webview.postMessage(await previewUpdatedEvent(document.uri))
  }
}
