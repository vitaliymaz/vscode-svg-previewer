import { Command } from '../commandManager';
import { PreviewManager } from '../features/previewManager';

export class ShowSourceCommand implements Command {
	public readonly id = 'svg.showSource';

	public constructor(
		private readonly previewManager: PreviewManager
	) { }

	public execute() {
		this.previewManager.showSource();
	}
}