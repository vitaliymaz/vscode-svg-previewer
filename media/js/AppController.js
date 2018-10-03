class AppController {
    constructor() {
        this.settingsManager = new SettingsManager();
        this.bodyEl = document.querySelector('body');
        this.svgController = SVGController.create(this.settingsManager.getSourceData());
        this.svgController.renderImage();
        
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