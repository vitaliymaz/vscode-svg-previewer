import { h, FunctionalComponent } from 'preact'

interface ZoomOutIconProps {
    className: string;
}

export const ZoomOutIcon: FunctionalComponent<ZoomOutIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" class={className}>
        <path fill="currentColor" d="M1 1v14h14V1H1zm0-1h14c.552 0 1 .448 1 1v14c0 .552-.448 1-1 1H1c-.552 0-1-.448-1-1V1c0-.552.448-1 1-1zm7.56 7.406h1.945c.273 0 .495.221.495.495 0 .273-.222.495-.495.495h-5.01c-.273 0-.495-.222-.495-.495 0-.274.222-.495.495-.495H8.56z"/>
    </svg>
)