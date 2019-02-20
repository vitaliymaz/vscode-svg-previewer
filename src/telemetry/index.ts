import TelemetryReporter from 'vscode-extension-telemetry';

import * as events from './events';

const extensionId = require('../../package.json').name;
const extensionVersion = require('../../package.json').version; 
const key = new Buffer('NGFjNjAyODUtYWZkYi00N2VkLTg4ZmMtMjI0YjY1YmJiMTFh', 'base64').toString();

export function createTelemetryReporter() : TelemetryReporter {
    return new TelemetryReporter(extensionId, extensionVersion, key);
}

export const TelemetryEvents = events;
