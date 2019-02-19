import TelemetryReporter from 'vscode-extension-telemetry';

import { Command } from '../commandManager';
import { PreviewManager } from '../features/previewManager';
import { TelemetryEvents } from '../telemetry';

export class ShowSourceCommand implements Command {
	public readonly id = 'svg.showSource';

	public constructor(
		private readonly previewManager: PreviewManager,
		private readonly telemetryReporter: TelemetryReporter
	) { }

	public execute() {
		this.telemetryReporter.sendTelemetryEvent(TelemetryEvents.TELEMETRY_EVENT_SHOW_SOURCE);
		this.previewManager.showSource();
	}
}