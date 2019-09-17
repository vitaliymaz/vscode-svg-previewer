import * as path from 'path';
import * as vscode from 'vscode';

export class SvgContentProvider implements vscode.TextDocumentContentProvider {

    constructor(
        private readonly _extensionPath: string
    ) {}

    public provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
        const source = vscode.Uri.parse(uri.query);
        return vscode.workspace.openTextDocument(source)
            .then(document => this.getHtml(document, source));
    }

    private getHtml(document: vscode.TextDocument, resource: vscode.Uri) {
        const base = `<base href="${this.getBaseUrl()}">`;
        const securityPolicy = `
            <meta http-equiv="Content-Security-Policy" 
                content="default-src 'none'; script-src vscode-resource:; img-src data: vscode-resource:; style-src vscode-resource:;">
        `;
        const css = `<link rel="stylesheet" type="text/css" href="vscode-resource:styles.css">`;
        const scripts = `<script type="text/javascript" src="vscode-resource:index.js"></script>`;
        return `<!DOCTYPE html><html><head>${base}${securityPolicy}${css}</head><body>${scripts}</body></html>`;
    }

    private getBaseUrl() {
        const mediaPath = vscode.Uri.file(path.join(this._extensionPath, 'media', '/'));
        return mediaPath.with({ scheme: 'vscode-resource' }).toString();
    }
}