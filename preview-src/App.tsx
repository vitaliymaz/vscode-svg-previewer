import { h, Component } from 'preact'
import { connect } from 'redux-zero/preact'
import messageBroker from './messaging'
import ToolbarContainer from './containers/ToolbarContainer'
import PreviewContainer from './containers/PreviewContainer'
import { actions, ISource, IState } from './store'

interface AppProps {
    updateSource: Function;
    updateSettings: Function;
    syncBackgroundWithTheme: Function;
    source: ISource;
}

const mapToProps = (state: IState) => ({ source: state.source })

class App extends Component<AppProps> {
  themeObserver = new MutationObserver(() => this.props.syncBackgroundWithTheme())

  componentDidMount () {
    messageBroker.addListener('source:update', this.props.updateSource)
    this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] })
  }

  componentWillUnmount () {
    messageBroker.removeListener('source:update', this.props.updateSource)
    this.themeObserver.disconnect()
  }

  render () {
    return (
      <div className='layout'>
        <ToolbarContainer />
        {this.props.source.data && <PreviewContainer />}
      </div>
    )
  }
}

export default connect(mapToProps, actions)(App)
