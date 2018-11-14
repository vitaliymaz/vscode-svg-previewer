import { IState, ISource, IBackground } from './IState';
import vscodeApi from '../vscode-api';
import { getByteCountByContent, humanFileSize } from './fileSize';

const SCALE_STEP = 0.1;
const MIN_SCALE = 0.1;
const MAX_SCALE = 20;

export const actions = () => ({
    updateSource: (state: IState, source: ISource) => {
        vscodeApi.setState(source);
        return { ...state, source, scale: 1, fileSize: humanFileSize(getByteCountByContent(source.data)) };
    },
    zoomIn: (state: IState) => {
        const nextScale = state.scale + state.scale * SCALE_STEP;
        return { ...state, scale: nextScale <= MAX_SCALE ? nextScale : state.scale };
    },
    zoomOut: (state: IState) => {
        const nextScale = state.scale - state.scale * SCALE_STEP;
        return { ...state, scale: nextScale >= MIN_SCALE ? nextScale : state.scale };
    },
    zoomReset: (state: IState) => ({ ...state, scale: 1 }),
    changeBackground: (state: IState, background: IBackground) => ({ ...state, background })
});
