import createStore from 'redux-zero'
import { IState } from './IState'
import { resolveBackground } from './background'
import vscodeApi from '../vscode-api'

const savedSource = vscodeApi.getState()
const defaultSettings = { showBoundingBox: false, showTransparencyGrid: false, background: 'auto' as const }
const settings = savedSource ? { ...defaultSettings, ...savedSource.settings } : defaultSettings

const initialState: IState = {
  source: {
    uri: savedSource ? savedSource.uri : null,
    data: savedSource ? savedSource.data : null,
    settings
  },
  scale: 1,
  fitToWindow: false,
  fitScale: 1,
  background: resolveBackground(settings.background),
  sourceImageValidity: false
}

export default createStore(initialState)
export { actions } from './actions'
export { IState, ISource } from './IState'
