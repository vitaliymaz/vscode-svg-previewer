import { h, Component } from 'preact';
import { connect } from 'redux-zero/preact';
import Toolbar from '../components/Toolbar';
import { actions, IState, ISource } from '../store';
import { getByteCountByContent, humanFileSize } from '../utils/fileSize';

interface ToolbarContainerProps {
    changeBackground: Function;
    zoomIn: Function;
    zoomOut: Function;
    zoomReset: Function;
    background: string;
    source: ISource;
    sourceImageValidity: boolean;
}

interface ToolbarContainerState {
    activeBtn?: string;
}

class ToolbarContainer extends Component<ToolbarContainerProps, ToolbarContainerState> {

    onChangeBackgroundButtonClick = (e: MouseEvent) => {
        this.props.changeBackground(e.srcElement!.getAttribute('name'));
    }

    getFileSize() {
        return this.props.source.data ?  humanFileSize(getByteCountByContent(this.props.source.data)) : '0 B';
    }

    onBtnMouseDown = (e: MouseEvent) => {
        this.setState({ activeBtn: (e.currentTarget as HTMLButtonElement)!.name });
    }

    onBtnMouseUp = () => {
        this.setState({ activeBtn: '' });
    }

    render() {
        return (
            <Toolbar 
                onChangeBackgroundButtonClick={this.onChangeBackgroundButtonClick}
                zoomIn={this.props.zoomIn}
                zoomOut={this.props.zoomOut}
                zoomReset={this.props.zoomReset}
                fileSize={this.getFileSize()}
                background={this.props.background}
                sourceImageValidity={this.props.sourceImageValidity}
                onBtnMouseDown={this.onBtnMouseDown}
                onBtnMouseUp={this.onBtnMouseUp}
                activeBtn={this.state.activeBtn}
            />
        );
    }
}

const mapToProps = (state: IState) => ({ background: state.background, source: state.source, sourceImageValidity: state.sourceImageValidity });

export default connect(mapToProps, actions)(ToolbarContainer);