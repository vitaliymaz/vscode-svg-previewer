import createStore from 'redux-zero'
import { IState } from './IState'
import vscodeApi from '../vscode-api'

const bodyElClassList = document.querySelector('body')!.classList

const initialState: IState = {
  source: {
    uri: vscodeApi.getState() ? vscodeApi.getState().uri : null,
    data: vscodeApi.getState() ? vscodeApi.getState().data : null,
    settings: vscodeApi.getState() ? vscodeApi.getState().settings : { showBoundingBox: false, showTransparencyGrid: false }
  },
  scale: 1,
  background: bodyElClassList.contains('vscode-dark') || bodyElClassList.contains('vscode-high-contrast')
    ? 'dark'
    : 'light',
  sourceImageValidity: false
}

export default createStore(initialState)
export { actions } from './actions'
export { IState, ISource } from './IState'
