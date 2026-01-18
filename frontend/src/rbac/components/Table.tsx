export function Table({ columns, data, onRowClick }: { columns: { header: string, accessor: string | ((row: any) => any) }[], data: any[], onRowClick?: (row: any) => void }) {
    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="table__empty">
                                No data available
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rIdx) => (
                            <tr
                                key={rIdx}
                                onClick={() => onRowClick?.(row)}
                                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                            >
                                {columns.map((col, cIdx) => (
                                    <td key={cIdx}>
                                        {typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
