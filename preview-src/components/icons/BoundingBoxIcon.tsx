import { h, FunctionalComponent } from 'preact'

interface BoundingBoxIconProps {
    className: string;
}

export const BoundingBoxIcon: FunctionalComponent<BoundingBoxIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class={className}>
        <path d="M2 13h1v1h10v-1h1V3h-1V2H3v1H2v10zm1 2v1H1c-.552 0-1-.448-1-1v-2h1V3H0V1c0-.552.448-1 1-1h2v1h10V0h2c.552 0 1 .448 1 1v2h-1v10h1v2c0 .552-.448 1-1 1h-2v-1H3z"/>
    </svg>
)