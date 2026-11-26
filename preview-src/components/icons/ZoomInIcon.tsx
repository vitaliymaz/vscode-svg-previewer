import { h, FunctionalComponent } from 'preact'

interface ZoomInIconProps {
    className: string;
}

export const ZoomInIcon: FunctionalComponent<ZoomInIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round" class={className}>
        <rect x="1.5" y="1.5" width="13" height="13" rx="2.5"/>
        <path d="M8 5v6M5 8h6"/>
    </svg>
)
