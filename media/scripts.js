const SCALE_STEP = 0.2;
const MIN_SCALE = 0.2;
const MAX_SCALE = 6;
const WIDTH_REGEXP = /<svg.+width="([0-9.,]+)/gm;
const HEIGHT_REGEXP = /<svg.+height="([0-9.,]+)/gm;

class SVGController {
    static create(sourceData) {
        const width = sourceData.match(WIDTH_REGEXP) ? parseInt(sourceData.match(WIDTH_REGEXP)[2]) : null;
        const height = sourceData.match(HEIGHT_REGEXP) ?  parseInt(sourceData.match(HEIGHT_REGEXP)[2]) : null;
        const newSourceData = sourceData.replace(/\r?\n|\r/gm, ' ');
        console.log(`create ${sourceData}`);
        console.log(`match 1: ${newSourceData.match(WIDTH_REGEXP)[0]}`);
        console.log(`match 2: ${newSourceData.match(WIDTH_REGEXP)[1]}`);
        console.log(`match 3: ${newSourceData.match(WIDTH_REGEXP)[2]}`);
        const hasDefinedDemension = !!(width && height);
        
        return hasDefinedDemension ?
            new SVGWithDemensionController({ sourceData, width, height }) : 
            new SVGWithoutDemensionController({ sourceData });
    }

    constructor(sourceData) {
        this.sourceData = sourceData;
        this.container = document.querySelector('body');
        this.state = { scale: 1 };
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
        this.renderScaledImage();
    }

    zoomOut() {
        const nextScale = this.state.scale - this.state.scale * SCALE_STEP;
        if (this.isScaleInAvaliableRange(nextScale)) {
            this.state.scale = nextScale;
        }
        this.renderScaledImage();
    }

    getScaledDemension(scale) {
        return {
            width: this.originalDemension.width * scale,
            height: this.originalDemension.height * scale
        };
    }

    renderScaledImage() {
        const { width, height } = this.getScaledDemension(this.state.scale);
        this.svgEl.setAttribute('width', width);
        this.svgEl.setAttribute('height', height);
    }

    isScaleInAvaliableRange(scale) {
        return scale >= MIN_SCALE && scale <= MAX_SCALE;
    }
}

class SVGWithDemensionController extends SVGController {
    constructor({ sourceData, width, height }) {
        super(sourceData);
        this.originalDemension = { width, height };
        console.log('with demension');
    }
}

class SVGWithoutDemensionController extends SVGController {
    constructor({ sourceData }) {
        super(sourceData);
        console.log('without demension');
        // const aspectRatio = this.svgEl.viewBox.baseVal.width / this.svgEl.viewBox.baseVal.height;
        // this.originalDemension = {
        //     width: this.bodyEl.clientWidth,
        //     height: this.bodyEl.clientWidth / aspectRatio,
        // };
        // this.normalizeUndefinedDemensionSvg();
    }

    renderImage() {
        super.renderImage();

    }

    normalizeUndefinedDemensionSvg() {
        this.svgEl.setAttribute('width', this.originalDemension.width);
        this.svgEl.setAttribute('height', this.originalDemension.height);
    }
}

class SettingsManager {
    constructor() {
        this.vscode = acquireVsCodeApi();
        this.dataEl = document.getElementById('vscode-svg-preview-data');
        this.state = {
            sourceUri: this.dataEl.dataset.sourceUri,
            sourceData: atob(this.dataEl.dataset.sourceData)
        };
        this.persist('sourceUri');
    }

    persist(key) {
        this.vscode.setState({ [key]: this.state[key] });
    }

    get(key) {
        return this.state[key];
    }
}

class AppController {
    constructor() {
        this.settingsManager = new SettingsManager();
        this.bodyEl = document.querySelector('body');
        
        this.svgController = SVGController.create(this.settingsManager.get('sourceData'));
        this.svgController.renderImage();
        
        // this.state = { zoom: 'in' };

        // this.bodyEl.addEventListener('keydown', this.onKeyDown.bind(this));
        // this.bodyEl.addEventListener('keyup', this.onKeyUp.bind(this));
        // this.bodyEl.addEventListener('click', this.onClick.bind(this));

        // window.addEventListener('wheel', this.onWheel.bind(this));
        // this.renderZoomCursor();
    }

    renderImage() {

    }

    renderZoomCursor() {
        this.bodyEl.classList.add(this.state.zoom === 'in'? 'zoom-in' : 'zoom-out');
        this.bodyEl.classList.remove(this.state.zoom === 'in'? 'zoom-out' : 'zoom-in');
    }

    onKeyDown(e) {
        if (e.which === 17) {
            this.state.zoom = 'out';
            this.renderZoomCursor();
        }
    }

    onKeyUp(e) {
        if (e.which === 17) {
            this.state.zoom = 'in';
            this.renderZoomCursor();
        }
    }

    onClick() {
        if (this.state.zoom === 'in') {
            this.svgController.zoomIn();
        }
        if (this.state.zoom === 'out') {
            this.svgController.zoomOut();
        }
    }

    onWheel(e) {
        if (!e.ctrlKey) return;
        let delta = Math.sign(e.wheelDelta);
        if (delta === 1) {
            this.svgController.zoomIn();
        }
        if (delta === -1) {
            this.svgController.zoomOut();
        }
    }
}

document.addEventListener("DOMContentLoaded", function(event) {
    new AppController();
});