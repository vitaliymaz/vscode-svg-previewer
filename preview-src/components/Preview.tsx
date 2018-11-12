import { h, FunctionalComponent, Ref } from 'preact';

interface PreviewProps {
    data: string;
    attachRef: Ref<HTMLImageElement>;
}

const Preview: FunctionalComponent<PreviewProps> = (props) => (
    <div className="preview">
        <img 
            src={`data:image/svg+xml,${encodeURIComponent(props.data)}`}
            ref={props.attachRef}
        />
    </div>
);

export default Preview;