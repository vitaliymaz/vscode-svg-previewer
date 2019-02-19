import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';

import { SvgContentProvider } from './features/previewContentProvider';
import { PreviewManager } from './features/previewManager';

import { CommandManager } from './commandManager';
import * as commands from './commands';

import { createTelemetryReporter, TelemetryEvents } from './telemetry';

let telemetryReporter: TelemetryReporter;

export function activate(context: vscode.ExtensionContext) {
    // telemetryReporter = <TelemetryReporter>{
    //     sendTelemetryEvent: function(eventName: string, properties?: {
    //         [key: string]: string;
    //     }, measurements?: {
    //         [key: string]: number;
    //     }) {
    //         console.log('telemetry', eventName, properties);
    //     },
    //     dispose: function() {
    //         return Promise.resolve();
    //     }
    // };
    telemetryReporter = createTelemetryReporter();

    telemetryReporter.sendTelemetryEvent(TelemetryEvents.TELEMETRY_EVENT_ACTIVATION);

    const contentProvider = new SvgContentProvider(context.extensionPath);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider ('svg-preview', contentProvider));

    const previewManager = new PreviewManager(context.extensionPath, telemetryReporter);
    vscode.window.registerWebviewPanelSerializer('svg-preview', previewManager);

    const commandManager = new CommandManager();
	context.subscriptions.push(commandManager);
    commandManager.register(new commands.ShowPreviewToSideCommand(previewManager, telemetryReporter));
    commandManager.register(new commands.ShowPreviewCommand(previewManager, telemetryReporter));
    
    commandManager.register(new commands.ShowSourceCommand(previewManager, telemetryReporter));
}

export function deactivate() {
    telemetryReporter.dispose();
}