import { useState, useEffect } from 'react';
import api from '../api/api';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FormInput } from '../components/FormInput';

export default function ProfilesPage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });

    // Matrix State
    const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
    const [matrix, setMatrix] = useState<any[]>([]); // Array of { permission, effect, ... }
    const [matrixLoading, setMatrixLoading] = useState(false);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = () => {
        setLoading(true);
        api.get('/profiles')
            .then(res => setProfiles(res.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const fetchMatrix = (profileId: string) => {
        setMatrixLoading(true);
        api.get(`/profiles/${profileId}/permissions`)
            .then(res => setMatrix(res.data.data || [])) // Assuming structured list or grouped
            .catch(console.error)
            .finally(() => setMatrixLoading(false));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/profiles', formData);
            setIsModalOpen(false);
            setFormData({ name: '', description: '' });
            fetchProfiles();
        } catch (err) {
            alert('Failed to create profile');
        }
    };

    const handleAssignPermission = async (profileId: string, permissionId: string, effect: 'ALLOW' | 'DENY') => {
        try {
            await api.post(`/profiles/${profileId}/permissions`, { permissionId, effect });
            // Refresh matrix
            fetchMatrix(profileId);
        } catch (err) {
            alert('Failed to update permission');
        }
    };

    const openMatrix = (profile: any) => {
        setSelectedProfile(profile);
        fetchMatrix(profile.id);
    };

    const columns = [
        { header: 'Profile Name', accessor: 'name' },
        { header: 'Description', accessor: 'description' },
        {
            header: 'Actions',
            accessor: (row: any) => (
                <Button variant="secondary" onClick={(e: any) => { e.stopPropagation(); openMatrix(row); }}>Manage Permissions</Button>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Profiles</h1>
                <Button onClick={() => setIsModalOpen(true)}>Create Profile</Button>
            </div>

            {loading ? <div>Loading...</div> : <Table columns={columns} data={profiles} />}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Profile">
                <form onSubmit={handleCreate}>
                    <FormInput label="Name" value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} required />
                    <FormInput label="Description" value={formData.description} onChange={(e: any) => setFormData({ ...formData, description: e.target.value })} />
                    <div style={{ textAlign: 'right', marginTop: '20px' }}>
                        <Button type="submit">Create</Button>
                    </div>
                </form>
            </Modal>

            {/* Permission Matrix View - Overlay or Bottom Section? Let's use a full screen Modal or just switch view? 
                Let's use a large Modal for the Matrix.
            */}
            <Modal isOpen={!!selectedProfile} onClose={() => setSelectedProfile(null)} title={`Permissions for ${selectedProfile?.name}`}>
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {matrixLoading ? <div>Loading Matrix...</div> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', background: '#f8f9fa' }}>
                                    <th style={{ padding: '8px' }}>Module</th>
                                    <th style={{ padding: '8px' }}>Action</th>
                                    <th style={{ padding: '8px' }}>Description</th>
                                    <th style={{ padding: '8px' }}>Effect</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matrix.map((p: any) => (
                                    <tr key={p.permission?.id || p.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '8px' }}>{p.permission?.module?.code || p.module}</td>
                                        <td style={{ padding: '8px' }}>{p.permission?.action || p.action}</td>
                                        <td style={{ padding: '8px', fontSize: '0.9em', color: '#666' }}>{p.permission?.description || p.description}</td>
                                        <td style={{ padding: '8px' }}>
                                            <select
                                                value={p.effect || 'NONE'}
                                                onChange={(e) => handleAssignPermission(selectedProfile.id, p.permission?.id || p.id, e.target.value as any)}
                                                style={{ padding: '4px', borderRadius: '4px', borderColor: p.effect === 'DENY' ? 'red' : p.effect === 'ALLOW' ? 'green' : '#ddd' }}
                                            >
                                                <option value="NONE">Not Set</option>
                                                <option value="ALLOW">ALLOW</option>
                                                <option value="DENY">DENY</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Modal>
        </div>
    );
}
