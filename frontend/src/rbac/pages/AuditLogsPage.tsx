import { useState, useEffect } from 'react';
import api from '../api/api';
import { Table } from '../components/Table';
import { Button } from '../components/Button';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ entity: '', action: '', userId: '' });

    // Pagination (Simple)
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchLogs();
    }, [page]); // Re-fetch on page change. Filters trigger manual search.

    const fetchLogs = () => {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('page', page.toString());
        if (filters.entity) params.append('entity', filters.entity);
        if (filters.action) params.append('action', filters.action);
        if (filters.userId) params.append('userId', filters.userId);

        api.get(`/audit-logs?${params.toString()}`)
            .then(res => setLogs(res.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    const columns = [
        { header: 'Date', accessor: (row: any) => new Date(row.created_at || Date.now()).toLocaleString() },
        { header: 'Action', accessor: 'action' },
        { header: 'Entity', accessor: 'entity' },
        { header: 'Entity ID', accessor: 'entity_id' },
        { header: 'User ID', accessor: 'user_id' },
        { header: 'Status', accessor: 'status' }, // success/failure
        { header: 'Details', accessor: (row: any) => JSON.stringify(row.details || {}).substring(0, 50) + '...' }
    ];

    return (
        <div>
            <h1>Audit Logs</h1>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#f4f4f4', padding: '10px', borderRadius: '4px' }}>
                <input
                    placeholder="Entity (e.g. USERS)"
                    value={filters.entity}
                    onChange={e => setFilters({ ...filters, entity: e.target.value })}
                    style={{ padding: '8px' }}
                />
                <input
                    placeholder="Action (e.g. CREATE)"
                    value={filters.action}
                    onChange={e => setFilters({ ...filters, action: e.target.value })}
                    style={{ padding: '8px' }}
                />
                <input
                    placeholder="User ID"
                    value={filters.userId}
                    onChange={e => setFilters({ ...filters, userId: e.target.value })}
                    style={{ padding: '8px' }}
                />
                <Button type="submit">Search</Button>
            </form>

            {loading ? <div>Loading...</div> : (
                <>
                    <Table columns={columns} data={logs} />
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                        <Button variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                        <span style={{ padding: '8px' }}>Page {page}</span>
                        <Button variant="secondary" onClick={() => setPage(p => p + 1)}>Next</Button>
                    </div>
                </>
            )}
        </div>
    );
}
