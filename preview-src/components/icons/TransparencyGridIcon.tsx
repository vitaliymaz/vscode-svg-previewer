import { h, FunctionalComponent } from 'preact'

interface TransparencyGridIconProps {
    className: string;
}

export const TransparencyGridIcon: FunctionalComponent<TransparencyGridIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" className={className}>
        <g fill="none" fill-rule="evenodd">
            <path fill="currentColor" fill-rule="nonzero" d="M1 1v14h14V1H1zm0-1h14c.552 0 1 .448 1 1v14c0 .552-.448 1-1 1H1c-.552 0-1-.448-1-1V1c0-.552.448-1 1-1z"/>
            <path fill="currentColor" d="M1 0h7v8H0V1c0-.552.448-1 1-1zM8 8h8v7c0 .552-.448 1-1 1H8V8z"/>
        </g>
    </svg>
)