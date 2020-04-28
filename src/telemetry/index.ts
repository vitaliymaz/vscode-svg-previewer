import TelemetryReporter from 'vscode-extension-telemetry';

import * as events from './events';

const extensionId = require('../../package.json').name;
const extensionVersion = require('../../package.json').version; 
const key = Buffer.from('NmE1MjFkYmYtYWEzOS00Y2QzLWEwMGMtZGFlMTQ5NzI5YzYz', 'base64').toString();

export function createTelemetryReporter() : TelemetryReporter {
    return new TelemetryReporter(extensionId, extensionVersion, key);
}

export const TelemetryEvents = events;
