import { h, FunctionalComponent } from 'preact'

interface TransparencyGridIconProps {
    className: string;
}

export const TransparencyGridIcon: FunctionalComponent<TransparencyGridIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" class={className}>
        <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" fill="none" stroke="currentColor"/>
        <path fill="currentColor" d="M4 3h4v5H3V4a1 1 0 0 1 1-1zM8 8h5v4a1 1 0 0 1-1 1H8V8z"/>
    </svg>
)
