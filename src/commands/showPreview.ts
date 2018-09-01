import * as vscode from 'vscode';

import { Command } from '../commandManager';
import { SvgPreviewManager } from '../features/svgPreviewManager';

async function showPreview(
	webviewManager: SvgPreviewManager,
	uri?: vscode.Uri,
): Promise<any> {
	if (uri) {
		webviewManager.preview(uri);
	}
}

export class ShowPreviewToSideCommand implements Command {
	public readonly id = 'svg.showPreviewToSide';

	public constructor(
		private readonly webviewManager: SvgPreviewManager
	) { }

	public execute(uri: vscode.Uri) {
		showPreview(this.webviewManager, uri? uri : this.getActiveEditorUri());
	}

	private getActiveEditorUri(): vscode.Uri | undefined {
		return vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri;
	}
}
