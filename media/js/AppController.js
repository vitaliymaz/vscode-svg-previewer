class AppController {
    constructor() {
        this.vscode = acquireVsCodeApi();

        this.messageBroker = new MessageBroker();
        this.messageBroker.on('update-preview', this.updatePreviewSource.bind(this));


        this.bodyEl = document.querySelector('body');
        
        this.state = { zoom: 'in' };

        this.bodyEl.addEventListener('keydown', this.onKeyDown.bind(this));
        this.bodyEl.addEventListener('keyup', this.onKeyUp.bind(this));
        this.bodyEl.addEventListener('click', this.onClick.bind(this));

        window.addEventListener('wheel', this.onWheel.bind(this));
        this.renderZoomCursor();

        if (this.vscode.getState()) {
            this.updatePreviewSource(this.vscode.getState());
        }
    }

    updatePreviewSource({ uri, data }) {
        this.vscode.setState({ uri, data });
        this.renderPreviewImage(data);
    }

    renderPreviewImage(data) {
        if (this.svgController) {
            this.svgController.destroy();
            this.svgController = null;
        }
        this.svgController = SVGController.create(data);
        this.svgController.renderImage();
    }

    renderZoomCursor() {
        this.bodyEl.classList.add(this.state.zoom === 'in'? 'zoom-in' : 'zoom-out');
        this.bodyEl.classList.remove(this.state.zoom === 'in'? 'zoom-out' : 'zoom-in');
    }

    onKeyDown(e) {
        if (this.isControlKeyEvent(e)) {
            this.state.zoom = 'out';
            this.renderZoomCursor();
        }
    }

    onKeyUp(e) {
        this.state.zoom = 'in';
        this.renderZoomCursor();
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

    isControlKeyEvent(e) {
        return this.isMacintosh() ? e.metaKey : e.ctrlKey;
    }

    isMacintosh() {
        return navigator.platform.indexOf('Mac') > -1
    }
}