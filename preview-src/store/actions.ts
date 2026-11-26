import { IState, ISource, IBackground } from './IState'
import { resolveBackground } from './background'
import vscodeApi from '../vscode-api'
import telemetryReporter from '../messaging/telemetry'

const DEFAULT_SCALE_STEP = 0.1
export const MIN_SCALE = 0.05
export const MAX_SCALE = 20

export const actions = () => ({
  updateSource: (state: IState, source: ISource) => {
    vscodeApi.setState(source)
    return {
      ...state,
      source,
      scale: source.uri === state.source.uri || state.fitToWindow ? state.scale : 1,
      background: resolveBackground(source.settings.background)
    }
  },
  zoomIn: (state: IState, step = DEFAULT_SCALE_STEP) => {
    const nextScale = +(state.scale + state.scale * step).toFixed(2)
    return { ...state, fitToWindow: false, scale: nextScale <= MAX_SCALE ? nextScale : MAX_SCALE }
  },
  zoomOut: (state: IState, step = DEFAULT_SCALE_STEP) => {
    const nextScale = +(state.scale - state.scale * step).toFixed(2)
    return { ...state, fitToWindow: false, scale: nextScale >= MIN_SCALE ? nextScale : MIN_SCALE }
  },
  zoomReset: (state: IState) => {
    telemetryReporter.sendZoomEvent('reset', 'toolbar')
    return { ...state, fitToWindow: false, scale: 1 }
  },
  zoomToFit: (state: IState) => {
    telemetryReporter.sendZoomEvent('fit', 'toolbar')
    return { ...state, fitToWindow: true, scale: state.fitScale }
  },
  setFitScale: (state: IState, fitScale: number) => ({ ...state, fitScale, scale: state.fitToWindow ? fitScale : state.scale }),
  changeBackground: (state: IState, background: IBackground) => {
    telemetryReporter.sendChangeBackgroundEvent(state.background, background)
    const source = { ...state.source, settings: { ...state.source.settings, background } }
    vscodeApi.setState(source)
    return { ...state, source, background }
  },
  syncBackgroundWithTheme: (state: IState) => ({ ...state, background: resolveBackground(state.source.settings.background) }),
  toggleSourceImageValidity: (state: IState, validity: boolean) => ({ ...state, sourceImageValidity: validity }),
  toggleTransparencyGrid: (state: IState) => {
    return { ...state, source: { ...state.source, settings: { ...state.source.settings, showTransparencyGrid: !state.source.settings.showTransparencyGrid } } }
  },
  toggleBoundingBox: (state: IState) => {
    return { ...state, source: { ...state.source, settings: { ...state.source.settings, showBoundingBox: !state.source.settings.showBoundingBox } } }
  }
})
