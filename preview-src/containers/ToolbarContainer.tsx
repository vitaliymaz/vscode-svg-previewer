import { h, Component } from 'preact'
import { connect } from 'redux-zero/preact'
import Toolbar from '../components/Toolbar'
import { actions, IState, ISource } from '../store'
import { getByteCountByContent, humanFileSize } from '../utils/fileSize'
import telemetryReporter from '../messaging/telemetry'
import messagingCommands from '../messaging/commands'

const SCALE_STEP = 0.5

interface ToolbarContainerProps {
  changeBackground: Function;
  zoomIn: Function;
  zoomOut: Function;
  zoomReset: Function;
  source: ISource;
  sourceImageValidity: boolean;
  scale: number;
  background: string,
  showBoundingBox: boolean;
  showTransparencyGrid: boolean;
  toggleBoundingBox: Function;
  toggleTransparencyGrid: Function;
}

interface ToolbarContainerState {
  activeBtn?: string;
}

class ToolbarContainer extends Component<ToolbarContainerProps, ToolbarContainerState> {
  componentDidMount () {
    window.document.addEventListener('mouseup', this.handleBtnMouseUp)
  }

  componentWillUnmount () {
    window.document.removeEventListener('mouseup', this.handleBtnMouseUp)
  }

  handleChangeBackgroundButtonClick = (e: MouseEvent) => {
    this.props.changeBackground((e.srcElement as HTMLButtonElement).getAttribute('name'))
  }

  handleTransparencyGridBtnClick = () => {
    this.props.toggleTransparencyGrid()
    messagingCommands.changeTransparencyGridVisibility(!this.props.showTransparencyGrid)
  }

  handleBoundingBoxBtnClick = () => {
    this.props.toggleBoundingBox()
    messagingCommands.changeBoundingBoxVisibility(!this.props.showBoundingBox)
  }

  getFileSize () {
    return this.props.source.data ? humanFileSize(getByteCountByContent(this.props.source.data)) : '0 B'
  }

  handleBtnMouseDown = (e: MouseEvent) => {
    this.setState({ activeBtn: (e.currentTarget as HTMLButtonElement)!.name })
  }

  handleBtnMouseUp = () => {
    this.setState({ activeBtn: '' })
  }

  zoomIn = () => {
    this.props.zoomIn(SCALE_STEP)
    telemetryReporter.sendZoomEvent('in', 'toolbar')
  }

  zoomOut = () => {
    this.props.zoomOut(SCALE_STEP)
    telemetryReporter.sendZoomEvent('out', 'toolbar')
  }

  render () {
    return (
      <Toolbar
        onChangeBackgroundButtonClick={this.handleChangeBackgroundButtonClick}
        zoomIn={this.zoomIn}
        zoomOut={this.zoomOut}
        zoomReset={this.props.zoomReset}
        fileSize={this.getFileSize()}
        sourceImageValidity={this.props.sourceImageValidity}
        onBtnMouseDown={this.handleBtnMouseDown}
        activeBtn={this.state.activeBtn}
        onToggleTransparencyGridClick={this.handleTransparencyGridBtnClick}
        onToggleBoundingBoxClick={this.handleBoundingBoxBtnClick}
        scale={this.props.scale}
        background={this.props.background}
        showBoundingBox={this.props.showBoundingBox}
        showTransparencyGrid={this.props.showTransparencyGrid}
      />
    )
  }
}

const mapToProps = (state: IState) => ({
  source: state.source,
  sourceImageValidity: state.sourceImageValidity,
  scale: state.scale,
  background: state.background,
  showBoundingBox: state.source.settings.showBoundingBox,
  showTransparencyGrid: state.source.settings.showTransparencyGrid
})

export default connect(mapToProps, actions)(ToolbarContainer)
