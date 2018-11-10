import createStore from 'redux-zero';
import { IState } from './IState';

declare var acquireVsCodeApi: any;

const vscode = acquireVsCodeApi();
const initialState: IState = {
    source: {
        uri: vscode.getState() ? vscode.getState().uri : null,
        data: vscode.getState() ? vscode.getState().data : null,
    }
};

export default createStore(initialState);
export { actions } from './actions';
export { IState, ISource } from './IState';