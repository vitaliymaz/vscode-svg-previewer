import { h, Component } from 'preact';
import { connect } from 'redux-zero/preact';
import messageBroker from './messaging';
import ToolbarContainer from './containers/ToolbarContainer';
import PreviewContainer from './containers/PreviewContainer';
import Store, { actions, ISource } from './store';

interface AppProps {
    updateSource: Function;
  }

class App extends Component<AppProps> {
    componentDidMount() {
        messageBroker.addListener('source:update', this.onSourceUpdate);
    }

    componentWillUnmount() {
        messageBroker.removeListener('source:update', this.onSourceUpdate);
    }

    onSourceUpdate = (source: ISource) => {
        this.props.updateSource(source);
    }

    render() {
        console.log('render');
        console.log(Store.getState());
        return (
            <div className="layout">
                <ToolbarContainer />
                <PreviewContainer />
            </div>
        );
    }
}

export default connect(null, actions)(App);