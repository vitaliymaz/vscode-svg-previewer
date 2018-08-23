import * as vscode from 'vscode';

interface ISession {
    uri: vscode.Uri;
    panel: Object; // Pannel
}

// Some service
// Implement Disposable
class PreviewManager {
    private session: Object | null = null;

    onDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined) {
        if (isSvg(editor) && this.session === null) { // if session of this svs is null
            // start new session 
            // close previous session
        }
        if (isSvg(editor) && currentSessionExists()) {
            // do nothing
        }
        if (!isSvg(editor)) {
            // close the session
        }
    }
}