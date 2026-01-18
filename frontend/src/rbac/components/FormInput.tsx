export function FormInput({ label, type = "text", value, onChange, required = false }: any) {
    return (
        <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ced4da" }}
            />
        </div>
    );
}
