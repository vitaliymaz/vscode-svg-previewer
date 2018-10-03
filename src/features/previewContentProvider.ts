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
        const source = vscode.Uri.parse(uri.query);
        return vscode.workspace.openTextDocument(source)
            .then(document => this.getHtml(document, source));
    }

    private getHtml(document: vscode.TextDocument, resource: vscode.Uri) {
        const settings = `
            <meta 
                id="vscode-svg-preview-data"
                data-source-uri="${resource.toString()}"
                data-source-data="${new Buffer(document.getText(), 'binary').toString('base64')}"
            >
        `;
        const base = `<base href="${this.getBaseUrl()}">`;
        const css = `<link rel="stylesheet" type="text/css" href="vscode-resource:styles.css">`;
        const scripts = `
        <script type="text/javascript" src="vscode-resource:js/SettingsManager.js"></script>
        <script type="text/javascript" src="vscode-resource:js/SVGController.js"></script>
        <script type="text/javascript" src="vscode-resource:js/AppController.js"></script>
        <script type="text/javascript" src="vscode-resource:js/scripts.js"></script>
        `;
        return `<!DOCTYPE html><html><head>${base}${css}${scripts}${settings}</head><body></body></html>`;
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