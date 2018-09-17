import * as vscode from 'vscode';

import { isSvgUri } from '../utils';
import { Preview } from './preview';
import { SvgContentProvider } from './previewContentProvider';

export class PreviewManager {
    private static readonly svgPreviewFocusContextKey = 'svgPreviewFocus';

    private readonly _disposables: vscode.Disposable[] = [];
    private _previews: Preview[] = [];
    private _activePreview?: Preview;

    constructor(
        private readonly _contentProvider: SvgContentProvider,
        private readonly _extensionPath: string
    ) {        
        vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument.bind(this), null, this._disposables);
        vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor.bind(this), null, this._disposables);
    }

    public showPreview(uri: vscode.Uri, viewColumn: vscode.ViewColumn) {
        const preview =  this.getPreviewOnTargetColumn(viewColumn) || this.createPreview(uri, viewColumn);
        this._contentProvider.update(uri);
        preview.update(uri);
        preview.panel.reveal(preview.panel.viewColumn);
    }

    public showSource() {
        vscode.workspace.openTextDocument(this._activePreview!.source)
            .then(document => vscode.window.showTextDocument(document));
    }

    public dispose(): void {
        this._disposables.forEach(ds => ds.dispose());
        this._previews.forEach(ds => ds.dispose());
    }

    private onDidChangeActiveTextEditor(editor: vscode.TextEditor): void {
        if (editor && isSvgUri(editor.document.uri)) {
            this._previews.forEach(preview => {
                preview.update(editor.document.uri);
            });
        }
    }

    private onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent): void {
        const preview = this.getPreviewOf(event.document.uri);
		if (preview) {
            this._contentProvider.update(event.document.uri);
            preview.update();
		}
    }

    private createPreview(uri: vscode.Uri, viewColumn: vscode.ViewColumn): Preview {
        const preview = Preview.create(uri, viewColumn, this._extensionPath);
        this.registerPreview(preview);
        return preview;
    }

    private registerPreview(preview: Preview) {
        this._previews.push(preview);
        this.onPreviewFocus(preview);
        preview.onDispose(() => {
            this.onPreviewBlur();
            this._previews.splice(this._previews.indexOf(preview), 1);
        });
    
        preview.onDidChangeViewState(({ webviewPanel }) => {                
            webviewPanel.active ? this.onPreviewFocus(preview) : this.onPreviewBlur();
        });
    }

    private onPreviewFocus(preview: Preview) {
        this._activePreview = preview;
        this.setSvgPreviewFocusContext(true);
    }
    
    private onPreviewBlur() {
        this._activePreview = undefined;
        this.setSvgPreviewFocusContext(false);
    }

    private setSvgPreviewFocusContext(value: boolean) {
        vscode.commands.executeCommand('setContext', PreviewManager.svgPreviewFocusContextKey, value);
    }

    private getPreviewOnTargetColumn(viewColumn: vscode.ViewColumn): Preview | undefined {
        const activeViewColumn = vscode.window.activeTextEditor ?
            vscode.window.activeTextEditor.viewColumn : vscode.ViewColumn.Active;

        return viewColumn === vscode.ViewColumn.Active ?
            this._previews.find(preview => preview.panel.viewColumn === activeViewColumn): 
            this._previews.find(preview => preview.panel.viewColumn === <number>activeViewColumn + 1);
    }
    
    private getPreviewOf(resource: vscode.Uri): Preview | undefined {
        return this._previews.find(p => p.source.fsPath === resource.fsPath);
	}
}