import { IState, ISource } from './IState';

export const actions = () => ({
    updateSource: (state: IState, source: ISource) => ({ ...state, source }),
});
