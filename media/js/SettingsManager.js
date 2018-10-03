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

    getSourceData() {
        return this.state.sourceData;
    }
}