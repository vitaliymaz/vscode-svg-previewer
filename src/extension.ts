import * as vscode from 'vscode';

const isSvgDocument = (document: vscode.TextDocument) => 
    document.languageId === 'xml' && document.fileName.endsWith('.svg');

export function activate(context: vscode.ExtensionContext) {
    // check opened file
    if (vscode.window.activeTextEditor && isSvgDocument(vscode.window.activeTextEditor.document)) {
        console.log('SVG is HERE');
    }

    vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor | undefined) => {
        if (e && isSvgDocument(e.document)) {
            console.log('SVG is HERE');
        }
    });
}

export function deactivate() {
}