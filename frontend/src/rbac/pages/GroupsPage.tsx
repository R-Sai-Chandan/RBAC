import { useState, useEffect } from 'react';
import api from '../api/api';
import { usePermissions } from '../hooks/usePermissions';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FormInput } from '../components/FormInput';

export default function GroupsPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const { canCreate, canUpdate } = usePermissions('GROUPS');

    // User Assignment Support
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = () => {
        setLoading(true);
        api.get('/groups')
            .then(res => setGroups(res.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const fetchUsers = () => {
        api.get('/users?status=active') // Need active users to add
            .then(res => setAllUsers(res.data.data || []))
            .catch(console.error);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/groups', formData);
            setIsCreateOpen(false);
            setFormData({ name: '', description: '' });
            fetchGroups();
        } catch (err) {
            alert('Failed to create group');
        }
    };

    const openManage = (group: any) => {
        setSelectedGroup(group);
        setIsManageOpen(true);
        fetchUsers();
    };

    const handleAddUser = async () => {
        if (!selectedUserId) return;
        try {
            await api.post(`/groups/${selectedGroup.id}/users`, { userId: selectedUserId });
            // Refresh group to see new user (assuming API returns updated group or we re-fetch)
            fetchGroups();
            // Also update local state if needed, but fetchGroups is safer.
            alert('User added');
            setIsManageOpen(false);
        } catch (err) {
            alert('Failed to assign user');
        }
    };

    // Note: If GET /groups doesn't return users, we can't show "Remove User" list easily.
    // We will assume `group.users` exists for now based on typical implementations.
    // If not, we just provide "Add User" capability.

    const columns = [
        { header: 'Group Name', accessor: 'name' },
        { header: 'Description', accessor: 'description' },
        {
            header: 'Members',
            accessor: (row: any) => row.users?.length || 0
        },
        {
            header: 'Actions',
            accessor: (row: any) => (
                <div style={{ display: 'flex', gap: '5px' }}>
                    {canUpdate && <Button variant="secondary" onClick={(e: any) => { e.stopPropagation(); openManage(row); }}>Manage Users</Button>}
                </div>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Groups</h1>
                {canCreate && <Button onClick={() => setIsCreateOpen(true)}>Create Group</Button>}
            </div>

            {loading ? <div>Loading...</div> : <Table columns={columns} data={groups} />}

            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Group">
                <form onSubmit={handleCreate}>
                    <FormInput label="Name" value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} required />
                    <FormInput label="Description" value={formData.description} onChange={(e: any) => setFormData({ ...formData, description: e.target.value })} />
                    <div style={{ textAlign: 'right', marginTop: '20px' }}>
                        <Button type="submit">Create</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isManageOpen} onClose={() => setIsManageOpen(false)} title={`Manage ${selectedGroup?.name}`}>
                <div>
                    <h4>Add User to Group</h4>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select
                            style={{ flex: 1, padding: '8px' }}
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                            <option value="">Select User...</option>
                            {allUsers.map(u => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
                        </select>
                        <Button onClick={handleAddUser}>Add</Button>
                    </div>

                    {selectedGroup?.users && selectedGroup.users.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h4>Current Members</h4>
                            <ul>
                                {selectedGroup.users.map((u: any) => (
                                    <li key={u.id}>
                                        {u.username}
                                        {/* Remove functionality requires DELETE /groups/:id/users/:uid */}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
