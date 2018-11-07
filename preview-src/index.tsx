import { h, render } from 'preact';

const Main = () => <div>Hello World</div>;

render(<Main />, document.querySelector('#root') as HTMLElement);
