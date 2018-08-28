import * as vscode from 'vscode';

export class SvgLangIdIdentifier {
    private static readonly svgActiveContextKey = 'svgActive';
    private static readonly svgPreviewActiveContextKey = 'svgPreviewActive';

    private _displosables: Array<vscode.Disposable> = [];

    constructor() {
        this.onChangeActiveEditor(vscode.window.activeTextEditor);

        // It doesn't fire this event after you close a preview panel and focus returs to editor. 
        // Looks like a vscode bug. 
        this._displosables.push(vscode.window.onDidChangeActiveTextEditor(this.onChangeActiveEditor.bind(this)));
    }

    public setSvgActiveContext(value: boolean) {
        vscode.commands.executeCommand('setContext', SvgLangIdIdentifier.svgActiveContextKey, value);
    }

    public setSvgPreviewActiveContext(value: boolean) {
        vscode.commands.executeCommand('setContext', SvgLangIdIdentifier.svgPreviewActiveContextKey, value);
    }

    public dispose(): void {
        this._displosables.forEach(el => el.dispose());
        this._displosables = [];
    }

    private onChangeActiveEditor(editor?: vscode.TextEditor): void {
        if (this.isSvgEditor(editor)) {
            this.setSvgActiveContext(true);
        } else {
            this.setSvgActiveContext(false);
        }
    }

    private isSvgEditor(editor?: vscode.TextEditor) {
        return editor
         && editor.document.languageId === 'xml' 
         && editor.document.fileName.endsWith('.svg');
    }
}