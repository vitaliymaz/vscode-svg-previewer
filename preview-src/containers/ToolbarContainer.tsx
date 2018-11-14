import { h, Component } from 'preact';
import { connect } from 'redux-zero/preact';
import Toolbar from '../components/Toolbar';
import { actions } from '../store';

interface ToolbarContainerProps {
    changeBackground: Function;
    zoomIn: Function;
    zoomOut: Function;
    zoomReset: Function;
    fileSize: number;
}

class ToolbarContainer extends Component<ToolbarContainerProps> {
    onChangeBackgroundButtonClick = (e: MouseEvent) => {
        this.props.changeBackground(e.srcElement!.getAttribute('name'));
    }

    render() {
        return (
            <Toolbar 
                onChangeBackgroundButtonClick={this.onChangeBackgroundButtonClick}
                zoomIn={this.props.zoomIn}
                zoomOut={this.props.zoomOut}
                zoomReset={this.props.zoomReset}
                fileSize={this.props.fileSize}
            />
        );
    }
}

export default connect(null, actions)(ToolbarContainer);