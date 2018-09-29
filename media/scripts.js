const SCALE_STEP = 0.2;
const MIN_SCALE = 0.2;
const MAX_SCALE = 6;

class SVGController {
    static create(svgEl, bodyEl) {
        const hasDefinedDemension = svgEl.hasAttribute('width') && svgEl.hasAttribute('height');
        return hasDefinedDemension ? new SVGWithDemensionController(svgEl, bodyEl) : new SVGWithoutDemensionController(svgEl, bodyEl);
    }

    constructor(svgEl, bodyEl) {
        this.state = { scale: 1 };
        this.svgEl = svgEl;
        this.bodyEl = bodyEl;
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
    constructor(svgEl, bodyEl) {
        super(svgEl, bodyEl);
        this.originalDemension = {
            width: parseInt(this.svgEl.getAttribute('width')),
            height: parseInt(this.svgEl.getAttribute('height'))
        };
    }
}

class SVGWithoutDemensionController extends SVGController {
    constructor(svgEl, bodyEl) {
        super(svgEl, bodyEl);
        const aspectRatio = this.svgEl.viewBox.baseVal.width / this.svgEl.viewBox.baseVal.height;
        this.originalDemension = {
            width: this.bodyEl.clientWidth,
            height: this.bodyEl.clientWidth / aspectRatio,
        };
        this.normalizeUndefinedDemensionSvg();
    }

    normalizeUndefinedDemensionSvg() {
        this.svgEl.setAttribute('width', this.originalDemension.width);
        this.svgEl.setAttribute('height', this.originalDemension.height);
    }
}

class AppController {
    constructor(bodyEl, svgController) {
        this.bodyEl = bodyEl;
        this.svgController = svgController;
        this.state = { zoom: 'in' };

        this.bodyEl.addEventListener('keydown', this.onKeyDown.bind(this));
        this.bodyEl.addEventListener('keyup', this.onKeyUp.bind(this));
        this.bodyEl.addEventListener('click', this.onClick.bind(this));

        window.addEventListener('wheel', this.onWheel.bind(this));
        this.renderZoomCursor();
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
    const bodyEl = document.querySelector('body');
    const svgEl = document.querySelector('svg');

    const svgController = new SVGController(svgEl, bodyEl);
    const zoomController = new AppController(bodyEl, SVGController.create(svgEl, bodyEl));
});