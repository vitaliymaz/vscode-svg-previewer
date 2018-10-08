import * as vscode from 'vscode';

export function isSvgUri(uri: vscode.Uri) {
    return uri.path.endsWith('.svg');
}

export function withSvgPreviewSchemaUri(uri: vscode.Uri) {
    return uri.with({
        scheme: 'svg-preview',
        query: uri.toString()
    });
}