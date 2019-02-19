import TelemetryReporter from 'vscode-extension-telemetry';

import * as events from './events';

const extensionId = '<your extension unique name>';
const extensionVersion = '<your extension version>'; 
const key = '<your key>';

export function createTelemetryReporter() : TelemetryReporter {
    return new TelemetryReporter(extensionId, extensionVersion, key);
}

export const TelemetryEvents = events;
