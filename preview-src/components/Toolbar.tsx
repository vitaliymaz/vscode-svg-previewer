import { h, FunctionalComponent } from 'preact';

interface ToolbarProps {
    onChangeBackgroundButtonClick: JSX.MouseEventHandler;
    zoomIn: Function;
    zoomOut: Function;
    zoomReset: Function;
    fileSize?: string;
    background: string;
    sourceImageValidity: boolean;
}

const Toolbar: FunctionalComponent<ToolbarProps> = ({
     onChangeBackgroundButtonClick, zoomIn, zoomOut, zoomReset, fileSize, background, sourceImageValidity
    }) => (
    <div className="toolbar">
        <div className="btn-group">
            <button disabled={!sourceImageValidity} onClick={zoomIn as JSX.MouseEventHandler}>+</button>
            <button disabled={!sourceImageValidity} onClick={zoomOut as JSX.MouseEventHandler}>-</button>
            <button disabled={!sourceImageValidity} onClick={zoomReset as JSX.MouseEventHandler}>1:1</button>
        </div>
        <div className="bg-group">
            <button disabled={!sourceImageValidity} className={`bg dark ${background === 'dark' ? 'selected' : ''}`} name="dark" onClick={onChangeBackgroundButtonClick} />
            <button disabled={!sourceImageValidity} className={`bg light ${background === 'light' ? 'selected' : ''}`} name="light" onClick={onChangeBackgroundButtonClick} />
            <button disabled={!sourceImageValidity} className={`bg transparent ${background === 'transparent' ? 'selected' : ''}`} name="transparent" onClick={onChangeBackgroundButtonClick} />
        </div>
        <div className="size">{fileSize}</div>
    </div>
);

export default Toolbar;