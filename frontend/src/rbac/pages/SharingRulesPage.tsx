import { useState, useEffect } from 'react';
import api from '../api/api';
import { usePermissions } from '../hooks/usePermissions';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FormInput } from '../components/FormInput';

export default function SharingRulesPage() {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modules] = useState<string[]>(['USERS', 'ROLES', 'PROFILES', 'GROUPS', 'AUDIT_LOGS']); // Hardcoded or fetch
    const [formData, setFormData] = useState({ name: '', module_id: '', rule_type: 'OWNER', conditions: '{}' });
    const { canCreate, canDelete } = usePermissions('SHARING');

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = () => {
        setLoading(true);
        api.get('/sharing-rules')
            .then(res => setRules(res.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/sharing-rules', {
                ...formData,
                conditions: JSON.parse(formData.conditions) // Validate JSON
            });
            setIsModalOpen(false);
            setFormData({ name: '', module_id: '', rule_type: 'OWNER', conditions: '{}' });
            fetchRules();
        } catch (err) {
            alert('Failed to create rule (Ensure conditions are valid JSON)');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this sharing rule?')) return;
        try {
            await api.delete(`/sharing-rules/${id}`);
            fetchRules();
        } catch (err) {
            alert('Failed to delete rule');
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name' },
        { header: 'Module', accessor: 'module_id' },
        { header: 'Type', accessor: 'rule_type' },
        {
            header: 'Actions',
            accessor: (row: any) => (
                canDelete && <Button variant="danger" onClick={(e: any) => { e.stopPropagation(); handleDelete(row.id); }}>Delete</Button>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Sharing Rules</h1>
                {canCreate && <Button onClick={() => setIsModalOpen(true)}>Create Rule</Button>}
            </div>

            {loading ? <div>Loading...</div> : <Table columns={columns} data={rules} />}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Sharing Rule">
                <form onSubmit={handleCreate}>
                    <FormInput label="Name" value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} required />

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Target Module</label>
                        <select
                            value={formData.module_id}
                            onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                            style={{ width: '100%', padding: '8px' }}
                            required
                        >
                            <option value="">Select Module...</option>
                            {modules.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Rule Type</label>
                        <select
                            value={formData.rule_type}
                            onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
                            style={{ width: '100%', padding: '8px' }}
                        >
                            <option value="OWNER">Owner Based</option>
                            <option value="CRITERIA">Criteria Based</option>
                        </select>
                    </div>

                    <FormInput
                        label="Conditions (JSON)"
                        value={formData.conditions}
                        onChange={(e: any) => setFormData({ ...formData, conditions: e.target.value })}
                        required
                    />

                    <div style={{ textAlign: 'right', marginTop: '20px' }}>
                        <Button type="submit">Create Rule</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
