import * as vscode from 'vscode';

const isSvgDocument = (document: vscode.TextDocument) => 
    document.languageId === 'xml' && document.fileName.endsWith('.svg');

class SettingsProvider implements vscode.TextDocumentContentProvider {
    public provideTextDocumentContent (uri : Uri) : string | Thenable<string> {
        let content = `<!DOCTYPE html><html><head></head><body>Hello <b>World</b></body></html>`;
        let docUri = vscode.Uri.parse(uri.query);
        return content;
        
        // return '<!DOCTYPE html><html><body>Hello <b>World</b></body></html>';
    }
}

function show (context : vscode.ExtensionContext)  : Thenable <vscode.TextEditor> {
    return new Promise <vscode.TextEditor> ((resolve, reject) => {
            let settingsUri = 'settings-preview://my-extension/fake/path/to/settings';
    
        // open a fake document (content served from the SettingsProvider)
            vscode.workspace.openTextDocument(vscode.Uri.parse(settingsUri))
                .then (doc => {
                    const panel = vscode.window.createWebviewPanel('catCoding', "Cat Coding", vscode.ViewColumn.Two, { });
                    panel.webview.html = doc.getText();
                });
        });
    }


export function activate(context: vscode.ExtensionContext) {
    const settingsProvider = new SettingsProvider();

    // register provider and a scheme
    const registration = vscode.Disposable.from (
        vscode.workspace.registerTextDocumentContentProvider ('settings-preview', settingsProvider)
    );

    // push it to context subscriptions
    context.subscriptions.push (
        registration
    );



        // check opened file
    if (vscode.window.activeTextEditor && isSvgDocument(vscode.window.activeTextEditor.document)) {
        console.log('SVG open 123');
        show(context);
    }

    vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor | undefined) => {
        console.log(e.document);
        if (e && isSvgDocument(e.document)) {
            console.log('SVG open');
            show(context);
        }
    });

    

}

export function deactivate() {
}