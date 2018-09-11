import * as vscode from 'vscode';

import { Preview } from './preview';

export class PreviewManager {
    private static readonly svgPreviewFocusContextKey = 'svgPreviewFocus';

    private _activePreview?: Preview;

    constructor(
        private readonly _extensionPath: string
    ) {}

    public showPreview(uri: vscode.Uri, viewColumn: vscode.ViewColumn) {
        const preview = Preview.create(uri, viewColumn, this._extensionPath);
        preview.update();
        this.registerPreview(preview);
    }

    public showSource() {
        if (!this._activePreview) { return; }
        vscode.workspace.openTextDocument(this._activePreview.source)
            .then(document => vscode.window.showTextDocument(document));
    }

    public dispose(): void {
        if (this._activePreview) {
            this._activePreview.dispose();
        }
    }

    private registerPreview(preview: Preview) {
        this.onPreviewFocus(preview);
        preview.onDispose(this.onPreviewBlur.bind(this));
    
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
}