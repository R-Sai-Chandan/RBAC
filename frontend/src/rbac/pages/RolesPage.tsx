import { useState, useEffect } from 'react';
import api from '../api/api';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FormInput } from '../components/FormInput';

interface Role {
    id: string;
    name: string;
    description: string;
    parent_role_id: string | null;
    children?: Role[];
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', parentRoleId: '' });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = () => {
        setLoading(true);
        api.get('/roles')
            .then(res => {
                const rawRoles = res.data.data || [];
                setRoles(buildTree(rawRoles));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const buildTree = (roles: any[]): Role[] => {
        const map = new Map();
        const roots: Role[] = [];
        // deep copy
        const list = roles.map(r => ({ ...r, children: [] }));

        list.forEach(r => map.set(r.id, r));
        list.forEach(r => {
            if (r.parent_role_id && map.has(r.parent_role_id)) {
                map.get(r.parent_role_id).children.push(r);
            } else {
                roots.push(r);
            }
        });
        return roots;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                parentRoleId: formData.parentRoleId || null
            };

            if (editingRole) {
                await api.put(`/roles/${editingRole.id}`, payload);
            } else {
                await api.post('/roles', payload);
            }
            setIsModalOpen(false);
            setEditingRole(null);
            fetchRoles();
        } catch (err) {
            alert('Failed to save role');
            console.error(err);
        }
    };

    const handleDelete = async (role: Role) => {
        if (!confirm(`Are you sure you want to delete ${role.name}?`)) return;
        try {
            await api.delete(`/roles/${role.id}`);
            fetchRoles();
        } catch (err: any) {
            alert('Failed to delete: ' + (err.response?.data?.message || err.message));
        }
    };

    const openCreate = () => {
        setEditingRole(null);
        setFormData({ name: '', description: '', parentRoleId: '' });
        setIsModalOpen(true);
    };

    const openEdit = (role: Role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description || '',
            parentRoleId: role.parent_role_id || ''
        });
        setIsModalOpen(true);
    };

    // Flatten for dropdown
    const getAllRoles = (nodes: Role[]): Role[] => {
        let list: Role[] = [];
        nodes.forEach(n => {
            list.push(n);
            if (n.children) list = list.concat(getAllRoles(n.children));
        });
        return list;
    };
    const flatRoles = getAllRoles(roles);

    const RoleNode = ({ role, level }: { role: Role, level: number }) => (
        <div style={{ marginLeft: level * 20 + 'px', marginTop: '10px', borderLeft: '2px solid #ddd', paddingLeft: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #eee' }}>
                <div>
                    <strong>{role.name}</strong> <span style={{ color: '#666', fontSize: '0.9em' }}>{role.description}</span>
                </div>
                <div>
                    <Button variant="secondary" onClick={() => openEdit(role)} style={{ marginRight: '5px' }}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(role)}>Delete</Button>
                </div>
            </div>
            {role.children && role.children.map(child => <RoleNode key={child.id} role={child} level={level + 1} />)}
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Roles & Hierarchy</h1>
                <Button onClick={openCreate}>Create Role</Button>
            </div>

            {loading ? <div>Loading...</div> : (
                <div>
                    {roles.length === 0 && <p>No roles found.</p>}
                    {roles.map(r => <RoleNode key={r.id} role={r} level={0} />)}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole ? 'Edit Role' : 'Create Role'}>
                <form onSubmit={handleSave}>
                    <FormInput
                        label="Role Name"
                        value={formData.name}
                        onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <FormInput
                        label="Description"
                        value={formData.description}
                        onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                    />

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Parent Role</label>
                        <select
                            value={formData.parentRoleId}
                            onChange={(e) => setFormData({ ...formData, parentRoleId: e.target.value })}
                            style={{ width: '100%', padding: '8px' }}
                        >
                            <option value="">(None - Root Role)</option>
                            {flatRoles.filter(r => r.id !== editingRole?.id).map(r => ( // Prevent self-parenting
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '20px' }}>
                        <Button type="submit">Save Role</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
