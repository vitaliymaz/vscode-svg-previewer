import * as vscode from 'vscode';

import { SvgLangIdIdentifier } from './features/svgLangIdIdentifier';
import { SvgContentProvider } from './features/previewContentProvider';
import { SvgPreviewManager } from './features/svgPreviewManager';

import { CommandManager } from './commandManager';
import * as commands from './commands';

export function activate(context: vscode.ExtensionContext) {
    const contentProvider = new SvgContentProvider(context.extensionPath);
    const previewManager = new SvgPreviewManager(contentProvider);
    context.subscriptions.push(previewManager);
    
    context.subscriptions.push(new SvgLangIdIdentifier());

    const commandManager = new CommandManager();
	context.subscriptions.push(commandManager);
    commandManager.register(new commands.ShowPreviewToSideCommand(previewManager));
    commandManager.register(new commands.ShowPreviewCommand(previewManager));
}

export function deactivate() {

}