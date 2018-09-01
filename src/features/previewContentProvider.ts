import * as path from 'path';
import * as vscode from 'vscode';

export class SvgContentProvider implements vscode.TextDocumentContentProvider {
    constructor(
        private readonly _extensionPath: string
    ) {}

    public provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
        return vscode.workspace.openTextDocument(vscode.Uri.parse(uri.query))
            .then(document => this.getHtml(document));
    }

    private getHtml(document: vscode.TextDocument) {
        const base = `<base href="${this.getBaseUrl()}">`;
        const css = `<link rel="stylesheet" type="text/css" href="vscode-resource:styles.css">`;
        const image = `<img src="data:image/svg+xml,${encodeURIComponent(document.getText())}" />`;
        return `<!DOCTYPE html><html><head>${base}${css}</head><body>${image}</body></html>`;
    }

    private getBaseUrl() {
        const mediaPath = vscode.Uri.file(path.join(this._extensionPath, 'media', '/'));
        return mediaPath.with({ scheme: 'vscode-resource' }).toString();
    }
}