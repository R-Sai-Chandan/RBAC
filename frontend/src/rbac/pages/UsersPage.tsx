
import { useState, useEffect } from 'react';
import api from '../api/api';
import { usePermissions } from '../hooks/usePermissions';
import type { User, Role } from '../types/models';
import { Table } from '../components/Table';
import type { Column } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FormInput } from '../components/FormInput';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ username: '', email: '', firstName: '', lastName: '', roleIds: [] as string[] });
    const [filterStatus, setFilterStatus] = useState('active');
    const { canCreate, canUpdate, canDelete } = usePermissions('USERS');

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [filterStatus]);

    const fetchUsers = () => {
        setLoading(true);
        api.get(`/users?status=${filterStatus}`)
            .then(res => setUsers(res.data.data || []))
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

    const handleDelete = async (user: User) => {
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

    const openEdit = (user: User) => {
        setEditingUser(user);
        const currentRoleIds = user.roles ? user.roles.map((r: Role) => r.id) : [];
        setFormData({
            username: user.username,
            email: user.email,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            roleIds: currentRoleIds
        });
        setIsModalOpen(true);
    };

    const columns: Column<User>[] = [
        { header: 'Username', accessor: 'username' },
        { header: 'Email', accessor: 'email' },
        { header: 'Status', accessor: 'status' },
        {
            header: 'Actions',
            accessor: (row: User) => (
                <div className="table__actions">
                    {canUpdate && <Button variant="secondary" onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEdit(row); }}>Edit</Button>}
                    {canDelete && row.status === 'active' && <Button variant="danger" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDelete(row); }}>Deactivate</Button>}
                </div>
            )
        }
    ];

    return (
        <div>
            <div className="page-header">
                <h1>User Management</h1>
                {canCreate && <Button onClick={openCreate}>Create User</Button>}
            </div>

            <div className="mb-10">
                <label className="form-label">
                    Filter Status:
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select" style={{ marginLeft: '10px', width: 'auto' }}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </label>
            </div>

            {loading ? <div>Loading...</div> : <Table columns={columns} data={users} />}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Create User'}>
                <form onSubmit={handleSave}>
                    <FormInput
                        label="Username"
                        value={formData.username}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                    <FormInput
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <FormInput
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                    <FormInput
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, lastName: e.target.value })}
                    />

                    <div className="form-group">
                        <label className="form-label">Roles</label>
                        <select
                            multiple
                            value={formData.roleIds}
                            onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                setFormData({ ...formData, roleIds: selected });
                            }}
                            className="form-select form-select--multiple"
                        >
                            {roles.map((r: Role) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <small className="form-help">Hold Ctrl to select multiple</small>
                    </div>

                    <div className="form-actions">
                        <Button type="submit">Save User</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
