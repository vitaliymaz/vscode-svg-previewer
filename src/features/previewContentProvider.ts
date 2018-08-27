import * as vscode from 'vscode';

export class SvgContentProvider implements vscode.TextDocumentContentProvider {
    public provideTextDocumentContent(): string {
        return '<html><body>Hello <b>World</b>!</body></html>';
    }
}