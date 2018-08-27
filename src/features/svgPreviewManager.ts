import * as vscode from 'vscode';

export class SvgPreviewManager {
    private static readonly contentProviderKey = 'svg-preview';

    private _disposables: vscode.Disposable[] = [];

    constructor(
        private readonly _contentProvider: vscode.TextDocumentContentProvider
    ) {
        this._disposables.push(
            vscode.workspace.registerTextDocumentContentProvider (SvgPreviewManager.contentProviderKey, this._contentProvider)
        );
    }

    public preview(uri: vscode.Uri) {
        let settingsUri = 'settings-preview://my-extension/fake/path/to/settings';
        // ERROR: cannot open settings-preview://my-extension/fake/path/to/settings. Detail: resource is not available
        vscode.workspace.openTextDocument(vscode.Uri.parse(settingsUri))
            .then (doc => {
                const panel = vscode.window.createWebviewPanel('catCoding', "Cat Coding", vscode.ViewColumn.Two, { });
                panel.webview.html = doc.getText();
            });
    }

    public dispose(): void {
        this._disposables.forEach(el => el.dispose());
        this._disposables = [];
    }
}