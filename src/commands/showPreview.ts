import * as vscode from 'vscode';

import { Command } from '../commandManager';
import { SvgPreviewManager } from '../features/svgPreviewManager';

abstract class PreviewCommand {
	public constructor(
		protected readonly webviewManager: SvgPreviewManager
	) { }

	protected showPreview(webviewManager: SvgPreviewManager, uri: vscode.Uri, viewColumn: vscode.ViewColumn): void {
		webviewManager.preview(uri, viewColumn);
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
