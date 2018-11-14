import { h, Component } from 'preact';
import { connect } from 'redux-zero/preact';
import { actions, ISource, IState } from '../store';
import Preview from '../components/Preview';

type dimension = { width: number, height: number };

interface PreviewContainerProps {
    source: ISource;
    scale: number;
    background: string;
    zoomIn: Function;
    zoomOut: Function;
}

const NEW_LINE_REGEXP = /[\r\n]+/g;
const SVG_TAG_REGEXP = /<svg.+?>/;
const WIDTH_REGEXP = /width=("|')([0-9.,]+)\w*("|')/;
const HEIGHT_REGEXP = /height=("|')([0-9.,]+)\w*("|')/;

class PreviewContainer extends Component<PreviewContainerProps> {
    private imageEl?: HTMLImageElement;

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

    onWheel = (event: WheelEvent) => {
        if (!event.ctrlKey) { return; }
        let delta = Math.sign(event.wheelDelta);
        if (delta === 1) {
            this.props.zoomIn();
        }
        if (delta === -1) {
            this.props.zoomOut();
        }
    }

    onError = () => {
        console.log('Error');
    }

    onLoad = () => {
        console.log('Load');
    }

    getOriginalDimension(data: string): dimension | null {
        const formatted = data.replace(NEW_LINE_REGEXP, ' ');
        const svg = formatted.match(SVG_TAG_REGEXP);
        let width = null, height = null;
        if (svg && svg.length) {
            width = svg[0].match(WIDTH_REGEXP) ? svg[0].match(WIDTH_REGEXP)![2] : null;
            height = svg[0].match(HEIGHT_REGEXP) ? svg[0].match(HEIGHT_REGEXP)![2] : null;
        }
        return width && height ? { width: parseFloat(width), height: parseFloat(width) } : null;
    }

    getScaledDimension() {
        const originalDimension = this.getOriginalDimension(this.props.source.data);

        const originalWidth = originalDimension ? originalDimension.width : 100;
        const originalHeight = originalDimension ? originalDimension.height : 100;
        const units = originalDimension ? 'px' : '%';

        return { 
            width: parseInt((originalWidth * this.props.scale).toString()),
            height: parseInt((originalHeight * this.props.scale).toString()),
            units 
        };
    }

    render() {
        return (
            <Preview
                data={this.props.source.data}
                attachRef={this.attachRef}
                dimension={this.getScaledDimension()}
                onWheel={this.onWheel}
                background={this.props.background}
            />
        );
    }
}

const mapToProps = (state: IState) => ({ source: state.source, scale: state.scale, background: state.background });

export default connect(mapToProps, actions)(PreviewContainer);
