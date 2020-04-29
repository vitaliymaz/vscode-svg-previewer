import TelemetryReporter from 'vscode-extension-telemetry'

import * as events from './events'

const extensionId = require('../../package.json').name
const extensionVersion = require('../../package.json').version
const key = Buffer.from('MDI0NGYzMTgtZGVkZC00NjIwLWI2OGItNzYwNzIyNDMwMmU1', 'base64').toString()

export function createTelemetryReporter () : TelemetryReporter {
  return new TelemetryReporter(extensionId, extensionVersion, key)
}

export const TelemetryEvents = events
