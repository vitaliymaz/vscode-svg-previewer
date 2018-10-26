const SCALE_STEP = 0.1;
const MIN_SCALE = 0.1;
const MAX_SCALE = 20;

const NEW_LINE_REGEXP = /[\r\n]+/g;
const SVG_TAG_REGEXP = /<svg.+?>/;
const WIDTH_REGEXP = /width=("|')([0-9.,]+)\w*("|')/;
const HEIGHT_REGEXP = /height=("|')([0-9.,]+)\w*("|')/;

function getDimension(sourceData = '') {
    const trimmedSourceData = sourceData.replace(NEW_LINE_REGEXP, ' ');
    const svgTag = trimmedSourceData.match(SVG_TAG_REGEXP) ? trimmedSourceData.match(SVG_TAG_REGEXP)[0] : '';
    const width = svgTag.match(WIDTH_REGEXP) ? svgTag.match(WIDTH_REGEXP)[2] : null;
    const height = svgTag.match(HEIGHT_REGEXP) ? svgTag.match(HEIGHT_REGEXP)[2] : null;
    return width && height ? { width: parseFloat(width), height: parseFloat(width) } : null;
}

export class SVGController {
    static create(sourceData) {
        const dimension = getDimension(sourceData);
        return dimension ?
            new SVGWithDimensionController(sourceData, { width: dimension.width, height: dimension.height }) :
            new SVGWithoutDimensionController(sourceData);
    }

    constructor(sourceData) {
        this.sourceData = sourceData;
        this.container = document.querySelector('body');
        this.state = { scale: 1 };

        this.renderError = this.renderError.bind(this);
    }

    applyImageDimension() {
        throw new Error('Should be overridden in sub-class');
    }

    renderImage() {
        this.imageElement = new Image();
        this.imageElement.setAttribute('alt', '');
        this.imageElement.addEventListener('error', this.renderError);
        const source = `data:image/svg+xml,${encodeURIComponent(this.sourceData)}`;
        this.imageElement.src = source;
        this.container.appendChild(this.imageElement);

        if (this.imageDidRender) {
            this.imageDidRender();
        }
    }

    renderError() {
        this._destroyImage();
        this.errorElement = document.createElement('div');
        this.errorElement.className = 'error-container';
        this.errorElement.innerHTML = `
            <img src="vscode-resource:error.png" />
            <div>
                <div>Image Not Loaded</div>
                <div>Try to open it externally to fix format problem</div>
            </div>
        `;
        this.container.appendChild(this.errorElement);
    }

    zoomIn() {
        const nextScale = this.state.scale + this.state.scale * SCALE_STEP;
        if (this.isScaleInAvaliableRange(nextScale)) {
            this.state.scale = nextScale;
        }
        this.applyImageDimension();
    }

    zoomOut() {
        const nextScale = this.state.scale - this.state.scale * SCALE_STEP;
        if (this.isScaleInAvaliableRange(nextScale)) {
            this.state.scale = nextScale;
        }
        this.applyImageDimension();
    }

    destroy() {
        this._destroyImage();
        this._destroyError();
    }

    _destroyImage() {
        if (this.imageElement) {
            this.imageElement.removeEventListener('error', this.renderError);
            this.imageElement.remove();
        }
    }

    _destroyError() {
        if (this.errorElement) this.errorElement.remove();
    }

    isScaleInAvaliableRange(scale) {
        return scale >= MIN_SCALE && scale <= MAX_SCALE;
    }
}

class SVGWithDimensionController extends SVGController {
    constructor(sourceData, { width, height }) {
        super(sourceData);
        this.originalDimension = { width, height };
    }

    imageDidRender() {
        this.applyImageDimension();
    }

    applyImageDimension() {
        const width = this.originalDimension.width * this.state.scale;
        const height = this.originalDimension.height * this.state.scale;
        this.imageElement.setAttribute('width', width);
        this.imageElement.setAttribute('height', height);

        this.imageElement.style.minWidth = `${width}px`;
        this.imageElement.style.minHeight = `${height}px`;
    }
}

class SVGWithoutDimensionController extends SVGController {
    constructor(sourceData) {
        super(sourceData);
        this.originalDimension = {
            width: 100, // %
            height: 100 // %
        };
    }

    imageDidRender() {
        this.applyImageDimension();
    }

    applyImageDimension() {
        const width = parseInt(this.originalDimension.width * this.state.scale);
        const height = parseInt(this.originalDimension.height * this.state.scale);

        this.imageElement.setAttribute('width', `${width}%`);
        this.imageElement.setAttribute('height', `${height}%`);
        
        this.imageElement.style.minWidth = `${width}%`;
        this.imageElement.style.minHeight= `${height}%`;
    }
}