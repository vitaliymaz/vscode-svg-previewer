import * as vscode from 'vscode'
import * as path from 'path'
import * as nls from 'vscode-nls'
import TelemetryReporter from 'vscode-extension-telemetry'

import { IMessage, activeColorThemeChangedEvent, previewUpdatedEvent, webviewMessageReciever } from '../webViewMessaging'
import { getResourceRoots, extensionResource, getWebviewContents } from '../utils'

const localize = nls.loadMessageBundle()

export class Preview {
  private static readonly viewType = 'svgPreviewer';

  private readonly _onDisposeEmitter = new vscode.EventEmitter<void>();
  public readonly onDispose = this._onDisposeEmitter.event;

  private readonly _onDidChangeViewStateEmitter = new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>();
  public readonly onDidChangeViewState = this._onDidChangeViewStateEmitter.event;

  private _postponedMessage?: IMessage;

  private changeThemeSubscription: vscode.Disposable;
  private recieveMessageSubscription: vscode.Disposable;

  public static async create (sourceUri: vscode.Uri, viewColumn: vscode.ViewColumn, extensionUri: vscode.Uri, telemetryReporter: TelemetryReporter) {
    const panel = vscode.window.createWebviewPanel(
      Preview.viewType,
      Preview.getPreviewTitle(sourceUri.path),
      viewColumn,
      {
        enableScripts: true,
        localResourceRoots: getResourceRoots(sourceUri, extensionUri)
      }
    )
    return new Preview(sourceUri, panel, extensionUri, telemetryReporter)
  }

  public static async revive (source: vscode.Uri, panel: vscode.WebviewPanel, extensionUri: vscode.Uri, telemetryReporter: TelemetryReporter) {
    return new Preview(source, panel, extensionUri, telemetryReporter)
  }

  private static getPreviewTitle (p: string): string {
    return localize('svg.preview.panel.title', 'Preview {0}', p.replace(/^.*[\\/]/, ''))
  }

  constructor (
    private _resource: vscode.Uri,
    private _panel: vscode.WebviewPanel,
    private readonly _extensionUri: vscode.Uri,
    private readonly telemetryReporter: TelemetryReporter
  ) {
    getWebviewContents(this._panel, this._resource, this._extensionUri).then(html => {
      this._panel.webview.html = html
      this.setPanelIcon()
    })

    this._panel.onDidChangeViewState((event: vscode.WebviewPanelOnDidChangeViewStateEvent) => {
      this._onDidChangeViewStateEmitter.fire(event)

      if (event.webviewPanel.visible && this._postponedMessage) {
        this.postMessage(this._postponedMessage)
        delete this._postponedMessage
      }
    })

    this._panel.onDidDispose(() => {
      this._onDisposeEmitter.fire()
      this.dispose()
      this.recieveMessageSubscription.dispose()
      this.changeThemeSubscription.dispose()
    })

    this.recieveMessageSubscription = this._panel.webview
      .onDidReceiveMessage(webviewMessageReciever.bind(null, this.telemetryReporter))

    this.changeThemeSubscription = vscode.window.onDidChangeActiveColorTheme(() => {
      this.postMessage(activeColorThemeChangedEvent())
    })
  }

  public get source () {
    return this._resource
  }

  public get panel (): vscode.WebviewPanel {
    return this._panel
  }

  public async update (resource?: vscode.Uri) {
    if (resource) {
      this._resource = resource
    }
    this._panel.title = Preview.getPreviewTitle(this._resource.fsPath)

    this.postMessage(await previewUpdatedEvent(this._resource))
  }

  public dispose () {
    this._panel.dispose()
  }

  private postMessage (message: IMessage): void {
    if (this._panel.visible) {
      this._panel.webview.postMessage(message)
    } else {
      // It is not possible posting messages to hidden web views
      // So saving the last update and flush it once panel become visible
      this._postponedMessage = message
    }
  }

  private setPanelIcon () {
    const root = extensionResource(this._panel, this._extensionUri, '/media/images')
    this._panel.iconPath = {
      light: vscode.Uri.file(path.join(root.path, 'preview.svg')),
      dark: vscode.Uri.file(path.join(root.path, 'preview-inverse.svg'))
    }
  }
}
