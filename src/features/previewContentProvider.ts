import * as vscode from 'vscode';

export class SvgContentProvider implements vscode.TextDocumentContentProvider {
    public provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
        return vscode.workspace.openTextDocument(vscode.Uri.parse(uri.query))
            .then(document => this.getHtml(document));
    }

    getHtml(document: vscode.TextDocument) {
        const image = `<img src="data:image/svg+xml,${encodeURIComponent(document.getText())}" />`;
        return `<!DOCTYPE html><html><body>${image}</html>`;
    }
}