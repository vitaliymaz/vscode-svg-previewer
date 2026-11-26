import { h, FunctionalComponent } from 'preact'

interface FitToWindowIconProps {
    className: string;
}

export const FitToWindowIcon: FunctionalComponent<FitToWindowIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" class={className}>
        <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/>
        <rect x="5.5" y="5.5" width="5" height="5" rx="1" fill="none" stroke="currentColor"/>
    </svg>
)
