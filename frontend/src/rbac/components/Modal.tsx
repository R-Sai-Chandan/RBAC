export function Modal({ isOpen, onClose, title, children }: any) {
    if (!isOpen) return null;
    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "500px", maxWidth: "90%", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
}
