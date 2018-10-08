import * as vscode from 'vscode';

import { SvgContentProvider } from './features/previewContentProvider';
import { PreviewManager } from './features/previewManager';

import { CommandManager } from './commandManager';
import * as commands from './commands';

export function activate(context: vscode.ExtensionContext) {
    const contentProvider = new SvgContentProvider(context.extensionPath);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider ('svg-preview', contentProvider));

    const previewManager = new PreviewManager(context.extensionPath);
    vscode.window.registerWebviewPanelSerializer('svg-preview', previewManager);

    const commandManager = new CommandManager();
	context.subscriptions.push(commandManager);
    commandManager.register(new commands.ShowPreviewToSideCommand(previewManager));
    commandManager.register(new commands.ShowPreviewCommand(previewManager));
    commandManager.register(new commands.ShowSourceCommand(previewManager));
}

export function deactivate() {

}