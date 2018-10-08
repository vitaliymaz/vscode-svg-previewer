const SCALE_STEP = 0.2;
const MIN_SCALE = 0.2;
const MAX_SCALE = 6;

const WIDTH_REGEXP = /<svg.+?width=("|')([0-9.,]+)\w*("|').+?>/;
const HEIGHT_REGEXP = /<svg.+?height=("|')([0-9.,]+)\w*("|').+?>/;
const NEW_LINE_REGEXP = /\r?\n|\r/gm;

function getDemension(sourceData) {
    const trimmedSourceData = sourceData.replace(NEW_LINE_REGEXP, ' ');
    const width = trimmedSourceData.match(WIDTH_REGEXP) ? trimmedSourceData.match(WIDTH_REGEXP)[2] : null;
    const height = trimmedSourceData.match(HEIGHT_REGEXP) ? trimmedSourceData.match(HEIGHT_REGEXP)[2] : null;
    return width && height ? { width: parseFloat(width), height: parseFloat(width) } : null;
}

class SVGController {
    static create(sourceData) {
        const demension = getDemension(sourceData);
        return demension ?
            new SVGWithDemensionController(sourceData, { width: demension.width, height: demension.height }) : 
            new SVGWithoutDemensionController(sourceData);
    }

    constructor(sourceData) {
        this.sourceData = sourceData;
        this.container = document.querySelector('body');
        this.state = { scale: 1 };
    }

    applyImageDemension() {
        throw new Error('Should be overridden in sub-class');
    }

    renderImage() {
        this.image = new Image();
        const source = `data:image/svg+xml,${encodeURIComponent(this.sourceData)}`;
        this.image.src = source;
        this.container.appendChild(this.image);
    }

    zoomIn() {
        const nextScale = this.state.scale + this.state.scale * SCALE_STEP;
        if (this.isScaleInAvaliableRange(nextScale)) {
            this.state.scale = nextScale;
        }
        this.applyImageDemension();
    }

    zoomOut() {
        const nextScale = this.state.scale - this.state.scale * SCALE_STEP;
        if (this.isScaleInAvaliableRange(nextScale)) {
            this.state.scale = nextScale;
        }
        this.applyImageDemension();
    }

    destroy() {
        this.image.remove();
    }

    getScaledDemension(scale) {
        return {
            width: this.originalDemension.width * scale,
            height: this.originalDemension.height * scale
        };
    }

    isScaleInAvaliableRange(scale) {
        return scale >= MIN_SCALE && scale <= MAX_SCALE;
    }
}

class SVGWithDemensionController extends SVGController {
    constructor(sourceData, { width, height }) {
        super(sourceData);
        this.originalDemension = { width, height };
    }

    applyImageDemension() {
        const { width, height } = this.getScaledDemension(this.state.scale);
        this.image.setAttribute('width', width);
        this.image.setAttribute('height', height);
    }
}

class SVGWithoutDemensionController extends SVGController {
    renderImage() {
        super.renderImage();
        setTimeout(() => this.normalizeUndefinedDemensionSvg(), 0);
    }

    normalizeUndefinedDemensionSvg() {
        this.originalDemension = {
            width: this.image.clientWidth,
            height: this.image.clientHeight,
        };
        this.applyImageDemension(this.originalDemension);
    }

    applyImageDemension({ width, height } = this.getScaledDemension(this.state.scale)) {
        this.image.setAttribute('width', width);
        this.image.setAttribute('height', height);

        this.image.style.minWidth = `${width}px`;
        this.image.style.minHeight = `${height}px`;
    }
}