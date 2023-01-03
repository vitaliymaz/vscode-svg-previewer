import * as vscode from 'vscode'
import * as path from 'path'
import * as nls from 'vscode-nls'
import TelemetryReporter from 'vscode-extension-telemetry'

import { IMessage, updatePreview, activeColorThemeChanged } from '../webViewMessaging'
import { TELEMETRY_EVENT_TOGGLE_BOUNDING_BOX, TELEMETRY_EVENT_TOGGLE_TRANSPARENCY_GRID } from '../telemetry/events'
import { getOriginalDimension } from '../utils/originalDimensions'
import { getByteCountByContent, humanFileSize } from '../utils/fileSize'

const localize = nls.loadMessageBundle()

export class Preview {
  private static readonly viewType = 'svg-preview';

  private readonly _onDisposeEmitter = new vscode.EventEmitter<void>();
  public readonly onDispose = this._onDisposeEmitter.event;

  private readonly _onDidChangeViewStateEmitter = new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>();
  public readonly onDidChangeViewState = this._onDidChangeViewStateEmitter.event;

  private _postponedMessage?: IMessage;

  private changeThemeSubscription: vscode.Disposable;

  public static async create (source: vscode.Uri, viewColumn: vscode.ViewColumn, extensionPath: string, telemetryReporter: TelemetryReporter) {
    const panel = vscode.window.createWebviewPanel(
      Preview.viewType,
      Preview.getPreviewTitle(source.path),
      viewColumn,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))]
      }
    )
    return new Preview(source, panel, extensionPath, telemetryReporter)
  }

  public static async revive (source: vscode.Uri, panel: vscode.WebviewPanel, extensionPath: string, telemetryReporter: TelemetryReporter) {
    return new Preview(source, panel, extensionPath, telemetryReporter)
  }

  private static getPreviewTitle (path: string): string {
    return localize('svg.preview.panel.title', 'Preview {0}', path.replace(/^.*[\\/]/, ''))
  }

  constructor (
    private _resource: vscode.Uri,
    private _panel: vscode.WebviewPanel,
    private readonly _extensionPath: string,
    private readonly telemetryReporter: TelemetryReporter
  ) {
    this._panel.webview.html = this.getHtml()

    this.setPanelIcon()

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
      this.changeThemeSubscription.dispose()
    })

    this._panel.webview.onDidReceiveMessage(message => {
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

    this.changeThemeSubscription = vscode.window.onDidChangeActiveColorTheme(() => {
      this.postMessage(activeColorThemeChanged())
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

    const message = await this.getUpdateWebViewMessage(this._resource)
    this.postMessage(message)
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

  private async getUpdateWebViewMessage (uri: vscode.Uri) {
    const document = await vscode.workspace.openTextDocument(uri)
    const text = document.getText()
    const dimension = text ? getOriginalDimension(text) : null
    const filesize = text ? humanFileSize(getByteCountByContent(text)) : null
    const showBoundingBox = <boolean>vscode.workspace.getConfiguration('svg').get('preview.boundingBox')
    const showTransparencyGrid = <boolean>vscode.workspace.getConfiguration('svg').get('preview.transparencyGrid')

    return updatePreview({
      uri: uri.toString(),
      data: { dimension, filesize, text },
      settings: { showBoundingBox, showTransparencyGrid }
    })
  }

  private setPanelIcon () {
    const root = path.join(this._extensionPath, 'media', 'images')
    this._panel.iconPath = {
      light: vscode.Uri.file(path.join(root, 'preview.svg')),
      dark: vscode.Uri.file(path.join(root, 'preview-inverse.svg'))
    }
  }

  private getHtml () {
    const webview = this._panel.webview

    const basePath = vscode.Uri.file(path.join(this._extensionPath, 'media'))
    const cssPath = vscode.Uri.file(path.join(this._extensionPath, 'media', 'styles', 'styles.css'))
    const jsPath = vscode.Uri.file(path.join(this._extensionPath, 'media', 'index.js'))

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
