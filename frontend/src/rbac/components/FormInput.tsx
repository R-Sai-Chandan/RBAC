export function FormInput({ label, type = "text", value, onChange, required = false }: any) {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                className="form-input"
            />
        </div>
    );
}
