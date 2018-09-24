import * as path from 'path';
import * as vscode from 'vscode';

export class SvgContentProvider implements vscode.TextDocumentContentProvider {
    private static readonly contentProviderKey = 'svg-preview';
	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

    constructor(
        private readonly _extensionPath: string
    ) {}

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(this.withSvgPreviewSchemaUri(uri));
    }

    public provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
        return vscode.workspace.openTextDocument(vscode.Uri.parse(uri.query))
            .then(document => this.getHtml(document));
    }

    private getHtml(document: vscode.TextDocument) {
        const base = `<base href="${this.getBaseUrl()}">`;
        const css = `<link rel="stylesheet" type="text/css" href="vscode-resource:styles.css">`;
        const image = `<img id="preview-img" src="data:image/svg+xml,${encodeURIComponent(document.getText())}" />`;
        const script = `<script type="text/javascript" src="vscode-resource:scripts.js"></script>`;
        return `<!DOCTYPE html><html><head>${base}${css}${script}</head><body>${image}</body></html>`;
    }

    private getBaseUrl() {
        const mediaPath = vscode.Uri.file(path.join(this._extensionPath, 'media', '/'));
        return mediaPath.with({ scheme: 'vscode-resource' }).toString();
    }

    private withSvgPreviewSchemaUri(uri: vscode.Uri) {
        return uri.with({
            scheme: SvgContentProvider.contentProviderKey,
            query: uri.toString()
        });
    }
}