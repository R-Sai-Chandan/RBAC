export function Button({ onClick, children, variant = "primary", className = "", ...props }: any) {
    const variantClass = variant === "primary" ? "btn" : `btn btn--${variant}`;
    return (
        <button
            onClick={onClick}
            className={`${variantClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
