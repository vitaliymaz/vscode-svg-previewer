import * as vscode from 'vscode';

export class SvgPreviewManager {
    private static readonly contentProviderKey = 'svg-preview';

    private _disposables: vscode.Disposable[] = [];

    constructor(
        private readonly _contentProvider: vscode.TextDocumentContentProvider,
    ) {
        this._disposables.push(
            vscode.workspace.registerTextDocumentContentProvider (SvgPreviewManager.contentProviderKey, this._contentProvider)
        );
    }

    public preview(uri: vscode.Uri, viewColumn: vscode.ViewColumn) {
        vscode.workspace.openTextDocument(this.normalizeUri(uri))
            .then (doc => {
                const panel = vscode.window.createWebviewPanel(
                    SvgPreviewManager.contentProviderKey,
                    this.getPreviewTitle(doc.fileName),
                    viewColumn
                );
                panel.webview.html = doc.getText();
            });
    }

    public dispose(): void {
        this._disposables.forEach(el => el.dispose());
        this._disposables = [];
    }

    private normalizeUri(uri: vscode.Uri): vscode.Uri {
        return uri.with({
            scheme: SvgPreviewManager.contentProviderKey,
            query: uri.toString()
        });
    }

    private getPreviewTitle(path: string): string {
        return `Preview ${path.replace(/^.*[\\\/]/, '')}`;
    }
}