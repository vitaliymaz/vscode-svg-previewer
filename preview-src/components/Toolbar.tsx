import { h, FunctionalComponent } from 'preact';

interface ToolbarProps {
    onChangeBackgroundButtonClick: JSX.MouseEventHandler;
    zoomIn: Function;
    zoomOut: Function;
    zoomReset: Function;
    fileSize: number;
}

const Toolbar: FunctionalComponent<ToolbarProps> = ({ onChangeBackgroundButtonClick, zoomIn, zoomOut, zoomReset, fileSize }) => (
    <div className="toolbar">
        <ul>
            <li><button onClick={zoomIn as JSX.MouseEventHandler}>Zoom In</button></li>
            <li><button onClick={zoomOut as JSX.MouseEventHandler}>Zoom In</button></li>
            <li><button onClick={zoomReset as JSX.MouseEventHandler}>Reset</button></li>
        </ul>
        <ul>
            <li><button name="dark" onClick={onChangeBackgroundButtonClick}>Dark</button></li>
            <li><button name="light" onClick={onChangeBackgroundButtonClick}>Light</button></li>
            <li><button name="transparent" onClick={onChangeBackgroundButtonClick}>None</button></li>
        </ul>
        {fileSize}
    </div>
);

export default Toolbar;