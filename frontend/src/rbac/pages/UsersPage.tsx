import { useState, useEffect } from 'react';
import api from '../api/api';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FormInput } from '../components/FormInput';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [formData, setFormData] = useState({ username: '', email: '', firstName: '', lastName: '', roleIds: [] as string[] });
    const [filterStatus, setFilterStatus] = useState('active'); // active | inactive

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [filterStatus]);

    const fetchUsers = () => {
        setLoading(true);
        api.get(`/users?status=${filterStatus}`) // Assuming backend supports filter
            .then(res => setUsers(res.data.data || [])) // Safety check
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const fetchRoles = () => {
        api.get('/roles')
            .then(res => setRoles(res.data.data || []))
            .catch(console.error);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.patch(`/users/${editingUser.id}`, formData);
            } else {
                await api.post('/users', { ...formData, roleIds: formData.roleIds });
            }
            setIsModalOpen(false);
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            alert('Failed to save user');
            console.error(err);
        }
    };

    const handleDelete = async (user: any) => {
        if (!confirm(`Are you sure you want to deactivate ${user.username}?`)) return;
        try {
            await api.delete(`/users/${user.id}`);
            fetchUsers();
        } catch (err) {
            alert('Failed to deactivate user');
            console.error(err);
        }
    };

    const openCreate = () => {
        setEditingUser(null);
        setFormData({ username: '', email: '', firstName: '', lastName: '', roleIds: [] });
        setIsModalOpen(true);
    };

    const openEdit = (user: any) => {
        setEditingUser(user);
        // Assuming user object has roles array of objects or IDs. 
        // If API returns roles array, we map to IDs.
        const currentRoleIds = user.roles ? user.roles.map((r: any) => r.id || r) : [];
        setFormData({
            username: user.username,
            email: user.email,
            firstName: user.first_name || '', // Map DB fields if needed
            lastName: user.last_name || '',
            roleIds: currentRoleIds
        });
        setIsModalOpen(true);
    };

    const columns = [
        { header: 'Username', accessor: 'username' },
        { header: 'Email', accessor: 'email' },
        { header: 'Status', accessor: 'status' }, // Assuming status field exists
        {
            header: 'Actions',
            accessor: (row: any) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" onClick={(e: any) => { e.stopPropagation(); openEdit(row); }}>Edit</Button>
                    {row.status === 'active' && <Button variant="danger" onClick={(e: any) => { e.stopPropagation(); handleDelete(row); }}>Deactivate</Button>}
                </div>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>User Management</h1>
                <Button onClick={openCreate}>Create User</Button>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ marginRight: '10px' }}>Filter Status:</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '5px' }}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {loading ? <div>Loading...</div> : <Table columns={columns} data={users} />}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Create User'}>
                <form onSubmit={handleSave}>
                    <FormInput
                        label="Username"
                        value={formData.username}
                        onChange={(e: any) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                    <FormInput
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <FormInput
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e: any) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                    <FormInput
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e: any) => setFormData({ ...formData, lastName: e.target.value })}
                    />

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Roles</label>
                        <select
                            multiple
                            value={formData.roleIds}
                            onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                setFormData({ ...formData, roleIds: selected });
                            }}
                            style={{ width: '100%', padding: '8px', height: '100px' }}
                        >
                            {roles.map((r: any) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <small style={{ color: '#666' }}>Hold Ctrl to select multiple</small>
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '20px' }}>
                        <Button type="submit">Save User</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
