import { h, FunctionalComponent } from 'preact'

interface ZoomOutIconProps {
    className: string;
}

export const ZoomOutIcon: FunctionalComponent<ZoomOutIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round" class={className}>
        <rect x="1.5" y="1.5" width="13" height="13" rx="2.5"/>
        <path d="M5 8h6"/>
    </svg>
)
