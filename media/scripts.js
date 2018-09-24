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

        this.renderZoomCursor();
    }

    renderZoomCursor() {
        this.bodyEl.classList.add(this.state.zoom === 'in'? 'zoom-in' : 'zoom-out');
        this.bodyEl.classList.remove(this.state.zoom === 'in'? 'zoom-out' : 'zoom-in');
    }

    renderScaledImage() {
        console.log(`scale: ${this.state.scale}`);
        this.imageEl.style.transform = `translate(-50%, -50%) scale(${this.state.scale})`;
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
        const nextScale = this.state.zoom === 'in' ? 
            this.state.scale + this.state.scale * SCALE_STEP : this.state.scale - this.state.scale * SCALE_STEP;
        if (nextScale >= MIN_SCALE && nextScale <= MAX_SCALE) {
            this.state.scale = nextScale;
            this.renderScaledImage();
        }
    }
}




document.addEventListener("DOMContentLoaded", function(event) {
    const bodyEl = document.querySelector('body');
    const imageEl = document.getElementById('preview-img');

    const zoomController = new ZoomController(bodyEl, imageEl);

});