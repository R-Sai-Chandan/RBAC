export function Button({ onClick, children, variant = "primary", className = "", ...props }: any) {
    const baseStyle = { padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "600" };
    const styles: any = {
        primary: { ...baseStyle, backgroundColor: "#007bff", color: "#fff" },
        secondary: { ...baseStyle, backgroundColor: "#6c757d", color: "#fff" },
        danger: { ...baseStyle, backgroundColor: "#dc3545", color: "#fff" },
    };
    return <button onClick={onClick} style={styles[variant]} className={className} {...props}>{children}</button>;
}
