/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

import { Command } from '../commandManager';
import { SvgPreviewManager } from '../features/svgPreviewManager';

async function showPreview(
	webviewManager: SvgPreviewManager,
	uri: vscode.Uri,
): Promise<any> {
	webviewManager.preview(uri);
}

export class ShowPreviewToSideCommand implements Command {
	public readonly id = 'svg.showPreviewToSide';

	public constructor(
		private readonly webviewManager: SvgPreviewManager
	) { }

	public execute(uri: vscode.Uri) {
		showPreview(this.webviewManager, uri);
	}
}
