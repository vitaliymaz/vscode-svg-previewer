import * as vscode from 'vscode'
import TelemetryReporter from 'vscode-extension-telemetry';
import { TELEMETRY_EVENT_TOGGLE_BOUNDING_BOX, TELEMETRY_EVENT_TOGGLE_TRANSPARENCY_GRID } from './telemetry/events';
import { getSvgDimension, getUriBinarySize, getUriText, humanFileSize } from './utils';

export interface IMessage {
    command: string;
    payload: any;
}

export function getPreviewPayloadSettings() {
  const config = vscode.workspace.getConfiguration('svg.preview')
  const showBoundingBox = <boolean>config.get('boundingBox')
  const showTransparencyGrid = <boolean>config.get('transparencyGrid')
  return { showBoundingBox, showTransparencyGrid }
}

export async function getPreviewPayloadData(uri: vscode.Uri) {
  const text = await getUriText(uri)
  const size = await getUriBinarySize(uri)

  const dimension = text ? getSvgDimension(text) : null
  const filesize = text ? humanFileSize(size) : null

  return { dimension, filesize }
}

export async function previewUpdatedEvent (uri: vscode.Uri) : Promise<IMessage> {
  return {
    command: 'source:update',
    payload: {
      uri: uri.toString(),
      data: await getPreviewPayloadData(uri),
      settings: getPreviewPayloadSettings()
    }
  }
}

export function activeColorThemeChangedEvent () : IMessage {
  return { command: 'theme:changed', payload: null }
}

export function webviewMessageReciever (telemetryReporter: TelemetryReporter, message: IMessage) : void {
  if (message.command === 'sendTelemetryEvent') {
    telemetryReporter.sendTelemetryEvent(message.payload.eventName, message.payload.properties)
  }
  if (message.command === 'changeBoundingBoxVisibility') {
    vscode.workspace.getConfiguration('svg').update('preview.boundingBox', message.payload.visible, true)
    telemetryReporter.sendTelemetryEvent(TELEMETRY_EVENT_TOGGLE_BOUNDING_BOX, { visible: message.payload.visible })
  }
  if (message.command === 'changeTransparencyGridVisibility') {
    vscode.workspace.getConfiguration('svg').update('preview.transparencyGrid', message.payload.visible, true)
    telemetryReporter.sendTelemetryEvent(TELEMETRY_EVENT_TOGGLE_TRANSPARENCY_GRID, { visible: message.payload.visible })
  }
}
