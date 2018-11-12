import { h, Component } from 'preact';
import { ISource } from '../store';
import Preview from '../components/Preview';

interface PreviewContainerProps {
    source: ISource;
}

interface PreviewContainerState {
    hasError: boolean;
}

class PreviewContainer extends Component<PreviewContainerProps, PreviewContainerState> {
    private imageEl?: HTMLImageElement;

    constructor(props: PreviewContainerProps) {
        super(props);
        this.state = { hasError: false };
    }

    componentDidMount() {
        this.imageEl!.addEventListener('error', this.onError);
        this.imageEl!.addEventListener('load', this.onLoad);
    }

    componentWillUnmount() {
        this.imageEl!.removeEventListener('error', this.onError);
        this.imageEl!.removeEventListener('load', this.onLoad);
    }

    attachRef = (el: HTMLImageElement) => {
        this.imageEl = el;
    }

    onError = () => {
        console.log('Error');
    }

    onLoad = () => {
        console.log('Load');
    }

    render() {
        return <Preview data={this.props.source.data} attachRef={this.attachRef} />;
    }
}

export default PreviewContainer;