import * as vscode from 'vscode';

export function isSvgUri(uri: vscode.Uri) {
    return uri.path.endsWith('.svg');
}