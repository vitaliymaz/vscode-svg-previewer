import { h, Component } from 'preact'
import { connect } from 'redux-zero/preact'
import { actions, ISource, IState } from '../store'
import { lightenDarkenColor } from '../utils/lightenDarkenColor'
import Preview from '../components/Preview'
import PreviewError from '../components/PreviewError'
import telemetryReporter from '../messaging/telemetry'
import messageBroker from '../messaging'
import { debounce } from '../utils/debounce'

type ChromeWheelEvent = WheelEvent & { wheelDelta: number; };

interface PreviewContainerProps {
  source: ISource;
  scale: number;
  background: string;
  zoomIn: Function;
  zoomOut: Function;
  toggleSourceImageValidity: Function;
  showTransparencyGrid: boolean;
}

interface PreviewContainerState {
  showPreviewError: boolean;
}

const COLOR_LIGHT_BASE = '#ffffff'
const COLOR_DARK_BASE = '#1e1e1e'

const cssVariables = {
  editorBackground: '--vscode-editor-background',
  editorBackgroundDarker: '--svg-previewer-editor-background-darker',
  editorBackgroundLighter: '--svg-previewer-editor-background-lighter',
  editorBackgroundLightBase: '--svg-previewer-editor-background-light-base',
  editorBackgroundLightBaseDarker: '--svg-previewer-editor-background-light-base-darker',
  editorBackgroundDarkBase: '--svg-previewer-editor-background-dark-base',
  editorBackgroundDarkBaseLighter: '--svg-previewer-editor-background-dark-base-lighter'
}

const EDITOR_BACKGROUND_OFFSET = 30

class PreviewContainer extends Component<PreviewContainerProps, PreviewContainerState> {
  private imageEl?: HTMLImageElement;
  sendZoomInTelemetryDebounced: Function;
  sendZoomOutTelemetryDebounced: Function;

  constructor (props: PreviewContainerProps) {
    super(props)

    this.sendZoomInTelemetryDebounced = debounce(
      () => telemetryReporter.sendZoomEvent('in', 'mousewheel'),
      250
    )

    this.sendZoomOutTelemetryDebounced = debounce(
      () => telemetryReporter.sendZoomEvent('out', 'mousewheel'),
      250
    )

    this.state = { showPreviewError: false }
  }

  componentDidMount () {
    this.imageEl!.addEventListener('error', this.onError)
    this.imageEl!.addEventListener('load', this.onLoad)
    messageBroker.addListener('theme:changed', this.defineThemeColors)

    this.defineThemeColors()
  }

  componentWillReceiveProps (nextProps: PreviewContainerProps) {
    if (nextProps.source.data !== this.props.source.data) {
      this.setState({ showPreviewError: false })
    }
  }

  componentWillUnmount () {
    messageBroker.removeListener('theme:changed', this.defineThemeColors)
  }

  defineThemeColors = () => {
    const editorBackgroundColor = window.getComputedStyle(document.documentElement).getPropertyValue(cssVariables.editorBackground)
    const editorBackgroundDarker = lightenDarkenColor(editorBackgroundColor, -(EDITOR_BACKGROUND_OFFSET))
    const editorBackgroundLighter = lightenDarkenColor(editorBackgroundColor, EDITOR_BACKGROUND_OFFSET)

    document.documentElement.style.setProperty(cssVariables.editorBackgroundDarker, editorBackgroundDarker)
    document.documentElement.style.setProperty(cssVariables.editorBackgroundLighter, editorBackgroundLighter)

    document.documentElement.style.setProperty(cssVariables.editorBackgroundLightBase, COLOR_LIGHT_BASE)
    document.documentElement.style.setProperty(cssVariables.editorBackgroundLightBaseDarker, lightenDarkenColor(COLOR_LIGHT_BASE, -(EDITOR_BACKGROUND_OFFSET)))

    document.documentElement.style.setProperty(cssVariables.editorBackgroundDarkBase, COLOR_DARK_BASE)
    document.documentElement.style.setProperty(cssVariables.editorBackgroundDarkBaseLighter, lightenDarkenColor(COLOR_DARK_BASE, EDITOR_BACKGROUND_OFFSET))
  }

  attachRef = (el: HTMLImageElement | null) => {
    if (el) {
      this.imageEl = el
    }
  }

  handleOnWheel = (event: WheelEvent) => {
    if (!(event.ctrlKey || event.metaKey)) { return }
    event.preventDefault()
    const delta = Math.sign((event as ChromeWheelEvent).wheelDelta)
    if (delta === 1) {
      this.props.zoomIn()
      this.sendZoomInTelemetryDebounced()
    }
    if (delta === -1) {
      this.props.zoomOut()
      this.sendZoomOutTelemetryDebounced()
    }
  }

  onError = () => {
    this.setState({ showPreviewError: true })
    this.props.toggleSourceImageValidity(false)
  }

  onLoad = () => {
    this.setState({ showPreviewError: false })
    this.props.toggleSourceImageValidity(true)
  }

  getWebviewResourcePath (source: string) {
    return document.getElementById('svg-previewer-resource')?.dataset.src || source;
  }

  getScaledDimension () {
    const originalDimension = this.props.source.data.dimension

    const originalWidth = originalDimension ? originalDimension.width : 100
    const originalHeight = originalDimension ? originalDimension.height : 100
    const units = originalDimension ? 'px' : '%'

    return {
      width: parseInt((originalWidth * this.props.scale).toString()),
      height: parseInt((originalHeight * this.props.scale).toString()),
      units
    }
  }

  render () {
    return this.state.showPreviewError
      ? <PreviewError />
      : (
        <Preview
          resource={this.getWebviewResourcePath(this.props.source.uri)}
          attachRef={this.attachRef}
          dimension={this.getScaledDimension()}
          onWheel={this.handleOnWheel}
          background={this.props.background}
          settings={this.props.source.settings}
          showTransparencyGrid={this.props.showTransparencyGrid}
        />
      )
  }
}

const mapToProps = (state: IState) => ({
  source: state.source,
  scale: state.scale,
  background: state.background,
  showTransparencyGrid: state.source.settings.showTransparencyGrid
})

export default connect(mapToProps, actions)(PreviewContainer)
