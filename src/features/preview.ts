import * as vscode from 'vscode';
import * as path from 'path';
import * as nls from 'vscode-nls';

const localize = nls.loadMessageBundle();

export class Preview {
    private static readonly contentProviderKey = 'svg-preview';

    private readonly _onDisposeEmitter = new vscode.EventEmitter<void>();
	public readonly onDispose = this._onDisposeEmitter.event;

	private readonly _onDidChangeViewStateEmitter = new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>();
	public readonly onDidChangeViewState = this._onDidChangeViewStateEmitter.event;

    public static create(source: vscode.Uri, viewColumn: vscode.ViewColumn, extensionPath: string) {
        const panel = vscode.window.createWebviewPanel(
            Preview.contentProviderKey,
            Preview.getPreviewTitle(source.path),
            viewColumn,
            { enableScripts: true }
        );
        return new Preview(source, panel, extensionPath);
    }

    public static revive(source: vscode.Uri, panel: vscode.WebviewPanel, extensionPath: string) {
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
        
        this._panel.onDidChangeViewState(e => {
            this._onDidChangeViewStateEmitter.fire(e);
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
        const doc = await vscode.workspace.openTextDocument(this.withSvgPreviewSchemaUri(this._resource));
        this._panel.webview.html = doc.getText();
        this._panel.title = Preview.getPreviewTitle(this._resource.fsPath);
    }

    public dispose() {
        this._panel.dispose();     
    }

    private withSvgPreviewSchemaUri(uri: vscode.Uri) {
        return uri.with({
            scheme: Preview.contentProviderKey,
            query: uri.toString()
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