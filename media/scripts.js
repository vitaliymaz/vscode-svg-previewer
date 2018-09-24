const SCALE_STEP = 0.2;
const MIN_SCALE = 0.2;
const MAX_SCALE = 6;

class ZoomController {
    constructor(bodyEl, imageEl) {
        this.bodyEl = bodyEl;
        this.imageEl = imageEl;
        this.state = {
            zoom: 'in',
            scale: 1
        };

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

    renderScaledImage() {
        this.imageEl.style.transform = `scale(${this.state.scale}) translate(-50%, -50%)`;
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
            this.zoomIn();
        }
        if (this.state.zoom === 'out') {
            this.zoomOut();
        }
    }

    onWheel(e) {
        if (!e.ctrlKey) return;
        let delta = Math.sign(e.wheelDelta);
        if (delta === 1) {
            this.zoomIn();
        }
        if (delta === -1) {
            this.zoomOut();
        }
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

    isScaleInAvaliableRange(scale) {
        return scale >= MIN_SCALE && scale <= MAX_SCALE;
    }
}




document.addEventListener("DOMContentLoaded", function(event) {
    const bodyEl = document.querySelector('body');
    const imageEl = document.getElementById('preview-img');

    const zoomController = new ZoomController(bodyEl, imageEl);

});