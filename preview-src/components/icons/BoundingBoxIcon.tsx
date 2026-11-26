import { h, FunctionalComponent } from 'preact'

interface BoundingBoxIconProps {
    className: string;
}

export const BoundingBoxIcon: FunctionalComponent<BoundingBoxIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" class={className}>
        <path d="M4.5 2.5h7M4.5 13.5h7M2.5 4.5v7M13.5 4.5v7"/>
        <rect x="1.5" y="1.5" width="2" height="2" rx=".5"/>
        <rect x="12.5" y="1.5" width="2" height="2" rx=".5"/>
        <rect x="1.5" y="12.5" width="2" height="2" rx=".5"/>
        <rect x="12.5" y="12.5" width="2" height="2" rx=".5"/>
    </svg>
)
