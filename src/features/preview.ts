import * as vscode from 'vscode';

export class Preview {
    private static readonly contentProviderKey = 'svg-preview';

    private readonly _onDisposeEmitter = new vscode.EventEmitter<void>();
	public readonly onDispose = this._onDisposeEmitter.event;

	private readonly _onDidChangeViewStateEmitter = new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>();
	public readonly onDidChangeViewState = this._onDidChangeViewStateEmitter.event;

    public static create(source: vscode.Uri, viewColumn: vscode.ViewColumn) {
        const panel = vscode.window.createWebviewPanel(
            Preview.contentProviderKey,
            Preview.getPreviewTitle(source.path),
            viewColumn
        );
        return new Preview(source, panel);
    }

    private static getPreviewTitle(path: string): string {
        return `Preview ${path.replace(/^.*[\\\/]/, '')}`;
    }

    constructor(
        private _source: vscode.Uri,
        private _panel: vscode.WebviewPanel
    ) {
        this._panel.onDidChangeViewState(e => {
            this._onDidChangeViewStateEmitter.fire(e);
        });
        this._panel.onDidDispose(() => {
            this._onDisposeEmitter.fire();
            this.dispose();
        });
    }

    public get source() {
        return this._source;
    }

    public async update() {
        const doc = await vscode.workspace.openTextDocument(this.normalizeUri(this._source));
        this._panel.webview.html = doc.getText();
    }

    public dispose() {
        this._panel.dispose();
    }

    private normalizeUri(uri: vscode.Uri) {
        return uri.with({
            scheme: Preview.contentProviderKey,
            query: uri.toString()
        });
    }
}