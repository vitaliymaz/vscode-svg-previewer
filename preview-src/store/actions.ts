import { IState, ISource } from './IState';
import vscodeApi from '../vscode-api';

export const actions = () => ({
    updateSource: (state: IState, source: ISource) => {
        vscodeApi.setState(source);
        return { ...state, source };
    },
});
