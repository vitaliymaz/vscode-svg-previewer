import type { IDimension } from './utils'

export interface IMessage {
    command: string;
    payload: any;
}

export interface IUpdatePreviewPayload {
    uri: string;
    data: {
      dimension: IDimension | null,
      filesize: string | null
    };
    settings: object;
}

export function updatePreview (payload: IUpdatePreviewPayload) : IMessage {
  return {
    command: 'source:update',
    payload
  }
}

export function activeColorThemeChanged () : IMessage {
  return { command: 'theme:changed', payload: null }
}
