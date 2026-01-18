export function Table({ columns, data, onRowClick }: { columns: { header: string, accessor: string | ((row: any) => any) }[], data: any[], onRowClick?: (row: any) => void }) {
    return (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
                <tr style={{ borderBottom: "2px solid #ddd", background: "#f8f9fa", textAlign: "left" }}>
                    {columns.map((col, idx) => (
                        <th key={idx} style={{ padding: "12px", color: "#495057" }}>{col.header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rIdx) => (
                    <tr key={rIdx} onClick={() => onRowClick?.(row)} style={{ borderBottom: "1px solid #ddd", cursor: onRowClick ? "pointer" : "default" }}>
                        {columns.map((col, cIdx) => (
                            <td key={cIdx} style={{ padding: "12px" }}>
                                {typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
