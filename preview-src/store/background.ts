import { IBackground, IBackgroundSetting } from './IState'

export function themeBackground (): IBackground {
  const bodyElClassList = document.querySelector('body')!.classList
  return bodyElClassList.contains('vscode-dark') || bodyElClassList.contains('vscode-high-contrast')
    ? 'dark'
    : 'light'
}

export function resolveBackground (setting?: IBackgroundSetting): IBackground {
  return setting === 'light' || setting === 'dark' ? setting : themeBackground()
}
