import { h, render } from 'preact';
import * as createStore from 'redux-zero';
import { Provider } from 'redux-zero/preact';

const store = (createStore as any)({
  profile: {},
  items: []
});

const Main = () =>  <Provider store={store}><div>Hello World</div></Provider>;

render(<Main />, document.querySelector('#root') as HTMLElement);
