import { h, FunctionalComponent } from 'preact'

interface ZoomResetIconProps {
    className: string;
}

export const ZoomResetIcon: FunctionalComponent<ZoomResetIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" class={className}>
        <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M2.5 5l2-1.5v9M11.5 5l2-1.5v9"/>
        <circle cx="8" cy="6.5" r="1" fill="currentColor"/>
        <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
    </svg>
)
