import { h, FunctionalComponent, Ref } from 'preact';

interface PreviewProps {
    data: string;
    attachRef: Ref<HTMLImageElement>;
    dimension: { width: number, height: number };
    onWheel: JSX.WheelEventHandler;
}

const Preview: FunctionalComponent<PreviewProps> = ({ data, attachRef, dimension: { width, height }, onWheel }) => (
    <div className="preview" onWheel={onWheel}>
        <img 
            src={`data:image/svg+xml,${encodeURIComponent(data)}`}
            ref={attachRef}
            style={{ width, minWidth: width, height, minHeight: height }}
        />
    </div>
);

export default Preview;