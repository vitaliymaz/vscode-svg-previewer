import * as vscode from 'vscode'
import TelemetryReporter from 'vscode-extension-telemetry'

import { PreviewManager } from './features/previewManager'
import { PreviewEditorProvider } from './features/previewEditor'

import { CommandManager } from './commandManager'
import * as commands from './commands'

import { createTelemetryReporter, TelemetryEvents } from './telemetry'

let telemetryReporter: TelemetryReporter

export function activate (context: vscode.ExtensionContext) {
  telemetryReporter = createTelemetryReporter()

  telemetryReporter.sendTelemetryEvent(TelemetryEvents.TELEMETRY_EVENT_ACTIVATION)

  const previewManager = new PreviewManager(context.extensionPath, telemetryReporter)
  vscode.window.registerWebviewPanelSerializer('svg-preview', previewManager)

  const commandManager = new CommandManager()

  commandManager.register(new commands.ShowPreviewToSideCommand(previewManager, telemetryReporter))
  commandManager.register(new commands.ShowPreviewCommand(previewManager, telemetryReporter))
  commandManager.register(new commands.ShowSourceCommand(previewManager, telemetryReporter))

  context.subscriptions.push(commandManager)

  context.subscriptions.push(PreviewEditorProvider.register(context.extensionPath, telemetryReporter))
}

export function deactivate () {
  telemetryReporter.dispose()
}
