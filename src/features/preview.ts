import * as vscode from 'vscode'
import * as path from 'path'
import * as nls from 'vscode-nls'
import TelemetryReporter from 'vscode-extension-telemetry'

import { IMessage, updatePreview, activeColorThemeChanged } from '../webViewMessaging'
import { TELEMETRY_EVENT_TOGGLE_BOUNDING_BOX, TELEMETRY_EVENT_TOGGLE_TRANSPARENCY_GRID } from '../telemetry/events'

const localize = nls.loadMessageBundle()

export class Preview {
  private static readonly viewType = 'svg-preview';

  private readonly _onDisposeEmitter = new vscode.EventEmitter<void>();
  public readonly onDispose = this._onDisposeEmitter.event;

  private readonly _onDidChangeViewStateEmitter = new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>();
  public readonly onDidChangeViewState = this._onDidChangeViewStateEmitter.event;

  private _postponedMessage?: IMessage;

  private changeThemeSubscription: vscode.Disposable;

  // onDidChangeTextDocument only fires while VS Code holds a text model for the file,
  // which it releases a while after the editor is closed. Watch the file itself too (#79).
  private _fileWatcher?: vscode.FileSystemWatcher;
  private _watchedResource?: string;

  private _disposed = false;
  private _updateSequence = 0;

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
      this._disposed = true
      this._onDisposeEmitter.fire()
      this.dispose()
      this.changeThemeSubscription.dispose()
      this.disposeFileWatcher()
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
      if (message.command === 'changeBackground' && ['light', 'dark'].includes(message.payload.background)) {
        vscode.workspace.getConfiguration('svg').update('preview.background', message.payload.background, true)
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

  public async update (resource?: vscode.Uri, sourceText?: string) {
    if (this._disposed) return
    if (resource) {
      this._resource = resource
    }
    this._panel.title = Preview.getPreviewTitle(this._resource.fsPath)
    this.watchResource()

    const sequence = ++this._updateSequence
    const message = await this.getUpdateWebViewMessage(this._resource, sourceText)
    // An editor change or a switch to another SVG can supersede an in-flight read.
    if (this._disposed || sequence !== this._updateSequence) return
    this.postMessage(message)
  }

  public dispose () {
    this._panel.dispose()
  }

  private watchResource () {
    if (this._watchedResource === this._resource.toString()) return
    this.disposeFileWatcher()
    this._watchedResource = this._resource.toString()
    if (this._resource.scheme !== 'file') return

    const pattern = new vscode.RelativePattern(path.dirname(this._resource.fsPath), path.basename(this._resource.fsPath))
    this._fileWatcher = vscode.workspace.createFileSystemWatcher(pattern, false, false, true)
    const onFileChange = () => { this.update() }
    this._fileWatcher.onDidChange(onFileChange)
    // Some tools replace the file instead of writing to it
    this._fileWatcher.onDidCreate(onFileChange)
  }

  private disposeFileWatcher () {
    if (this._fileWatcher) {
      this._fileWatcher.dispose()
      this._fileWatcher = undefined
    }
    this._watchedResource = undefined
  }

  private async getSourceText (uri: vscode.Uri): Promise<string> {
    // Unsaved edits win; otherwise read the file, which may be newer than a text model VS Code hasn't reloaded yet
    const document = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri.toString())
    if (document && document.isDirty) {
      return document.getText()
    }
    try {
      const bytes = await vscode.workspace.fs.readFile(uri)
      return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('utf8').replace(/^\uFEFF/, '')
    } catch (e) {
      return (await vscode.workspace.openTextDocument(uri)).getText()
    }
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

  private async getUpdateWebViewMessage (uri: vscode.Uri, sourceText?: string) {
    const data = sourceText === undefined ? await this.getSourceText(uri) : sourceText
    const showBoundingBox = <boolean>vscode.workspace.getConfiguration('svg').get('preview.boundingBox')
    const showTransparencyGrid = <boolean>vscode.workspace.getConfiguration('svg').get('preview.transparencyGrid')
    const background = <string>vscode.workspace.getConfiguration('svg').get('preview.background')

    return updatePreview({
      uri: uri.toString(),
      data,
      settings: { showBoundingBox, showTransparencyGrid, background }
    })
  }

  private setPanelIcon () {
    const root = path.join(this._extensionPath, 'media', 'images')
    this._panel.iconPath = {
      light: vscode.Uri.file(path.join(root, 'Preview.svg')),
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
