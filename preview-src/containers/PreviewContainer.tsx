import { h, Component } from 'preact'
import { connect } from 'redux-zero/preact'
import { actions, ISource, IState } from '../store'
import { lightenDarkenColor } from '../utils/lightenDarkenColor'
import Preview from '../components/Preview'
import PreviewError from '../components/PreviewError'
import telemetryReporter from '../messaging/telemetry'
import messageBroker from '../messaging'
import { debounce } from '../utils/debounce'

type dimension = { width: number, height: number };

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

const NEW_LINE_REGEXP = /[\r\n]+/g
const SVG_TAG_REGEXP = /<svg.+?>/
// Whole attribute name only (not stroke-width, data-height, ...), optional spaces around "="
const WIDTH_REGEXP = /\swidth\s*=\s*("|')\s*([0-9]*\.?[0-9]+)\s*([a-z]*)\s*\1/i
const HEIGHT_REGEXP = /\sheight\s*=\s*("|')\s*([0-9]*\.?[0-9]+)\s*([a-z]*)\s*\1/i

// CSS pixels per unit. Other units (%, ex, ...) are not supported and fall back to the default size.
const PX_PER_UNIT: { [unit: string]: number } = {
  '': 1,
  px: 1,
  pt: 4 / 3,
  pc: 16,
  in: 96,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  q: 96 / 101.6,
  em: 16
}

function parseLength (tag: string, regexp: RegExp): number | null {
  const match = tag.match(regexp)
  if (!match) return null
  const pxPerUnit = PX_PER_UNIT[match[3].toLowerCase()]
  return pxPerUnit ? parseFloat(match[2]) * pxPerUnit : null
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
  zoomInTelemetryDebounced: Function;
  zoomOutTelemetryDebounced: Function;

  constructor (props: PreviewContainerProps) {
    super(props)

    this.zoomInTelemetryDebounced = debounce(
      () => telemetryReporter.sendZoomEvent('in', 'mousewheel'),
      250
    )

    this.zoomOutTelemetryDebounced = debounce(
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
      this.zoomInTelemetryDebounced()
    }
    if (delta === -1) {
      this.props.zoomOut()
      this.zoomOutTelemetryDebounced()
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

  getOriginalDimension (data: string): dimension | null {
    const formatted = data.replace(NEW_LINE_REGEXP, ' ')
    const svg = formatted.match(SVG_TAG_REGEXP)
    if (!svg) return null
    const width = parseLength(svg[0], WIDTH_REGEXP)
    const height = parseLength(svg[0], HEIGHT_REGEXP)
    return width && height ? { width, height } : null
  }

  getScaledDimension () {
    const originalDimension = this.getOriginalDimension(this.props.source.data)

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
          data={this.props.source.data}
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
