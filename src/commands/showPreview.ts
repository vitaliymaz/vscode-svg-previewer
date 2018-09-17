import * as vscode from 'vscode';

import { isSvgUri } from '../utils';
import { Command } from '../commandManager';
import { PreviewManager } from '../features/previewManager';

abstract class PreviewCommand {
	public constructor(
		protected readonly webviewManager: PreviewManager
	) { }

	protected showPreview(webviewManager: PreviewManager, uri: vscode.Uri, viewColumn: vscode.ViewColumn): void {
		if (isSvgUri(uri)) {
			webviewManager.showPreview(uri, viewColumn);
		}
	}

	protected getActiveEditorUri(): vscode.Uri | undefined {
		return vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri;
	}
}


export class ShowPreviewCommand extends PreviewCommand implements Command  {
	public readonly id = 'svg.showPreview';

	public execute(uri?: vscode.Uri) {
		const resource = uri || this.getActiveEditorUri();
		if (resource) {
			this.showPreview(this.webviewManager, resource, vscode.ViewColumn.Active);
		}
	}
}

export class ShowPreviewToSideCommand extends PreviewCommand implements Command  {
	public readonly id = 'svg.showPreviewToSide';

	public execute(uri?: vscode.Uri) {
		const resource = uri || this.getActiveEditorUri();
		if (resource) {
			this.showPreview(this.webviewManager, resource, vscode.ViewColumn.Beside);
		}
	}
}
