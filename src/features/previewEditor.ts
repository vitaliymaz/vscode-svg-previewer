import * as vscode from 'vscode'
import TelemetryReporter from 'vscode-extension-telemetry'

import { activeColorThemeChangedEvent, previewUpdatedEvent, webviewMessageReciever } from '../webViewMessaging'
import { getWebviewContents, getResourceRoots } from '../utils'
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

    const update = async () => {
      webviewPanel.webview.postMessage(await previewUpdatedEvent(document.uri))
    }

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: getResourceRoots(document.uri, this.extensionUri)
    }
    webviewPanel.webview.html = await getWebviewContents(webviewPanel, document.uri, this.extensionUri)

    await update()

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        update()
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
}
