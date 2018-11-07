import { h, render } from 'preact';
import createStore from 'redux-zero';
import { Provider } from 'redux-zero/preact';

const store = createStore({});

const Main = () =>  <Provider store={store}><div>Hello World</div></Provider>;

render(<Main />, document.querySelector('#root') as HTMLElement);
