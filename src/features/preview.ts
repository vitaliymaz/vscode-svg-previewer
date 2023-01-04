import * as vscode from 'vscode'
import * as path from 'path'
import * as nls from 'vscode-nls'
import TelemetryReporter from 'vscode-extension-telemetry'

import { IMessage, updatePreview, activeColorThemeChanged } from '../webViewMessaging'
import { TELEMETRY_EVENT_TOGGLE_BOUNDING_BOX, TELEMETRY_EVENT_TOGGLE_TRANSPARENCY_GRID } from '../telemetry/events'
import { getOriginalDimension, getByteCountByContent, humanFileSize, escapeAttribute, getHash } from '../utils'

const localize = nls.loadMessageBundle()

export class Preview {
  private static readonly viewType = 'svg-preview';

  private readonly _onDisposeEmitter = new vscode.EventEmitter<void>();
  public readonly onDispose = this._onDisposeEmitter.event;

  private readonly _onDidChangeViewStateEmitter = new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>();
  public readonly onDidChangeViewState = this._onDidChangeViewStateEmitter.event;

  private _postponedMessage?: IMessage;

  private changeThemeSubscription: vscode.Disposable;

  public static async create (source: vscode.Uri, viewColumn: vscode.ViewColumn, extensionUri: vscode.Uri, telemetryReporter: TelemetryReporter) {
    const panel = vscode.window.createWebviewPanel(
      Preview.viewType,
      Preview.getPreviewTitle(source.path),
      viewColumn,
      {
        enableScripts: true,
        localResourceRoots: [path.resolve(extensionUri.path, 'media')]
      }
    )
    return new Preview(source, panel, extensionUri, telemetryReporter)
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
      data: { dimension, filesize },
      settings: { showBoundingBox, showTransparencyGrid }
    })
  }

  private setPanelIcon () {
    const root = this.extensionResource('/media/images')
    this._panel.iconPath = {
      light: vscode.Uri.file(path.join(root, 'preview.svg')),
      dark: vscode.Uri.file(path.join(root, 'preview-inverse.svg'))
    }
  }

  private getHtml () {
    const webview = this._panel.webview

    const basePath = this.extensionResource('/media')
    const cssPath = this.extensionResource('/media/styles/styles.css')
    const jsPath = this.extensionResource('/media/index.js')

    const token = getToken()
		const version = Date.now().toString();

		const source = await this.getResourcePath(this._panel, this._resource, version);

    const base = `<base href="${escapeAttribute(basePath)}">`
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: ${cspSource}; script-src 'nonce-${token}'; style-src ${cspSource} 'nonce-${token}';">`
    const metadata = `<meta id="svg-previewer-source" data-src="${escapeAttribute(source)}">`
    const css = `<link rel="stylesheet" type="text/css" href="${escapeAttribute(cssPath)}" nonce="${token}">`
    const scripts = `<script type="text/javascript" src="${escapeAttribute(jsPath)}" nonce="${token}"></script>`

    return `<!DOCTYPE html><html><head>${base}${csp}${css}${metadata}</head><body>${script}</body></html>`
  }

	private async getResourcePath (webviewEditor: vscode.WebviewPanel, resource: vscode.Uri, version: string): Promise<string> {
		if (resource.scheme === 'git') {
			const stat = await vscode.workspace.fs.stat(resource);
			if (stat.size === 0) {
				return this.emptySvgDataUri;
			}
		}

		// Avoid adding cache busting if there is already a query string
		if (resource.query) {
			return this._panel.webview.asWebviewUri(resource).toString();
		}
		return this._panel.webview.asWebviewUri(resource).with({ query: `version=${version}` }).toString();
	}

	private extensionResource (path: string) {
		return this._panel.webview.asWebviewUri(this._extensionUri.with({
			path: this._extensionUri.path + path
		}));
	}
}
