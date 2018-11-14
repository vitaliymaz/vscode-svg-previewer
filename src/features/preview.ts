import * as vscode from 'vscode';
import * as path from 'path';
import * as nls from 'vscode-nls';

import { withSvgPreviewSchemaUri } from '../utils';
import { updatePreview } from '../webViewMessaging';

const localize = nls.loadMessageBundle();

export class Preview {
    private static readonly contentProviderKey = 'svg-preview';

    private readonly _onDisposeEmitter = new vscode.EventEmitter<void>();
	public readonly onDispose = this._onDisposeEmitter.event;

	private readonly _onDidChangeViewStateEmitter = new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>();
	public readonly onDidChangeViewState = this._onDidChangeViewStateEmitter.event;

    public static async create(source: vscode.Uri, viewColumn: vscode.ViewColumn, extensionPath: string) {
        const panel = vscode.window.createWebviewPanel(
            Preview.contentProviderKey,
            Preview.getPreviewTitle(source.path),
            viewColumn,
            { enableScripts: true }
        );
        const doc = await vscode.workspace.openTextDocument(withSvgPreviewSchemaUri(source));
        panel.webview.html = doc.getText();
        return new Preview(source, panel, extensionPath);
    }

    public static async revive(source: vscode.Uri, panel: vscode.WebviewPanel, extensionPath: string) {
        const doc = await vscode.workspace.openTextDocument(withSvgPreviewSchemaUri(source));
        panel.webview.html = doc.getText();
        return new Preview(source, panel, extensionPath);
    }

    private static getPreviewTitle(path: string): string {
        return localize('svg.preview.panel.title', 'Preview {0}', path.replace(/^.*[\\\/]/, ''));
    }

    constructor(
        private _resource: vscode.Uri,
        private _panel: vscode.WebviewPanel,
        private readonly _extensionPath: string,
    ) {
        this.setPanelIcon();
        
        this._panel.onDidChangeViewState((event: vscode.WebviewPanelOnDidChangeViewStateEvent) => {
            this._onDidChangeViewStateEmitter.fire();
        });
        
        this._panel.onDidDispose(() => {
            this._onDisposeEmitter.fire();
            this.dispose();
        });
    }

    public get source() {
        return this._resource;
    }

    public get panel(): vscode.WebviewPanel {
        return this._panel;
    }

    public async update(resource?: vscode.Uri) {
        if (resource) {
            this._resource = resource;
        }
        const message = await this.getUpdateWebViewMessage(this._resource);
        this._panel.webview.postMessage(message);
        this._panel.title = Preview.getPreviewTitle(this._resource.fsPath);
    }

    public dispose() {
        this._panel.dispose();     
    }

    private async getUpdateWebViewMessage(uri: vscode.Uri) {
        const document = await vscode.workspace.openTextDocument(uri);
        return updatePreview({
            uri: uri.toString(),
            data: document.getText()
        });
    }

    private setPanelIcon() {
        const root = path.join(this._extensionPath, 'media');
        this._panel.iconPath = {
            light: vscode.Uri.file(path.join(root, 'Preview.svg')),
            dark: vscode.Uri.file(path.join(root, 'Preview_inverse.svg'))
        };
    }
}