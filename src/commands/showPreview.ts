import * as vscode from 'vscode'
import TelemetryReporter from 'vscode-extension-telemetry'

import { isSvgUri } from '../utils'
import { Command } from '../commandManager'
import { PreviewManager } from '../features/previewManager'
import { TelemetryEvents } from '../telemetry'

function getShowPreviewEventProperties () {
  return { autoOpen: 'no' }
}

abstract class PreviewCommand {
  public constructor (
    protected readonly webviewManager: PreviewManager,
    protected readonly telemetryReporter: TelemetryReporter
  ) { }

  protected showPreview (webviewManager: PreviewManager, uri: vscode.Uri, viewColumn: vscode.ViewColumn): void {
    if (isSvgUri(uri)) {
      webviewManager.showPreview(uri, viewColumn)
    }
  }

  protected getActiveEditorUri (): vscode.Uri | undefined {
    if (vscode.window.activeTextEditor) {
      return vscode.window.activeTextEditor.document.uri
    }
    // Not a text editor, e.g. VS Code's built-in Image Preview. The tabGroups API
    // (VS Code 1.67+) is not in the 1.52 typings, so feature-detect it.
    const tabGroups = (vscode.window as any).tabGroups
    const input = tabGroups && tabGroups.activeTabGroup.activeTab && tabGroups.activeTabGroup.activeTab.input
    return input && input.uri instanceof vscode.Uri ? input.uri : undefined
  }
}

export class ShowPreviewCommand extends PreviewCommand implements Command {
  public readonly id = 'svg.showPreview';

  public execute (uri?: vscode.Uri) {
    const resource = uri || this.getActiveEditorUri()
    if (resource) {
      this.telemetryReporter.sendTelemetryEvent(TelemetryEvents.TELEMETRY_EVENT_SHOW_PREVIEW, getShowPreviewEventProperties())
      this.showPreview(this.webviewManager, resource, vscode.ViewColumn.Active)
    }
  }
}

export class ShowPreviewToSideCommand extends PreviewCommand implements Command {
  public readonly id = 'svg.showPreviewToSide';

  public execute (uri?: vscode.Uri) {
    const resource = uri || this.getActiveEditorUri()
    if (resource) {
      this.telemetryReporter.sendTelemetryEvent(TelemetryEvents.TELEMETRY_EVENT_SHOW_PREVIEW_TO_SIDE, getShowPreviewEventProperties())
      this.showPreview(this.webviewManager, resource, vscode.ViewColumn.Beside)
    }
  }
}
