import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

interface NavChild {
    code: string;
    label: string;
    route: string;
    isVisible: boolean;
    actions: string[];
}

interface NavModule {
    code: string;
    label: string;
    route: string;
    icon: string;
    isVisible: boolean;
    actions: string[];
    children: NavChild[];
}

/**
 * AdminLayout - Main layout for authenticated users
 * Sidebar is built ONLY from /rbac/me/navigation (backend-provided)
 * No hardcoded admin paths.
 */
export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [navModules, setNavModules] = useState<NavModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/me/navigation')
            .then(res => {
                setNavModules(res.data.data.modules || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load navigation', err);
                if (err.response?.status === 401) {
                    navigate('/rbac/login');
                } else {
                    setError('Failed to load navigation');
                }
                setLoading(false);
            });
    }, [navigate]);

    const handleLogout = async () => {
        await logout();
        navigate('/rbac/login');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div>Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                {error}
                <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{
                padding: '12px 20px',
                background: '#1a1a2e',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>RBAC System</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Link to="/rbac/profile" style={{ color: '#fff', textDecoration: 'none' }}>
                        {user?.fullName || user?.username || 'User'}
                    </Link>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '6px 12px',
                            background: '#e94560',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar - Built from backend navigation ONLY */}
                <aside style={{
                    width: '250px',
                    background: '#16213e',
                    padding: '15px',
                    overflowY: 'auto'
                }}>
                    <nav>
                        {/* Profile Link (always visible for authenticated users) */}
                        <div style={{ marginBottom: '20px' }}>
                            <Link
                                to="/rbac/profile"
                                style={{
                                    color: location.pathname === '/rbac/profile' ? '#e94560' : '#ccc',
                                    textDecoration: 'none',
                                    display: 'block',
                                    padding: '8px 10px',
                                    borderRadius: '4px',
                                    background: location.pathname === '/rbac/profile' ? 'rgba(233, 69, 96, 0.1)' : 'transparent'
                                }}
                            >
                                My Profile
                            </Link>
                        </div>

                        {/* Dynamic Navigation from Backend */}
                        {navModules.map(module => (
                            <div key={module.code} style={{ marginBottom: '15px' }}>
                                <div style={{
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    padding: '8px 10px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {module.label}
                                </div>

                                {/* Sub-sections */}
                                {module.children && module.children.map(child => (
                                    <Link
                                        key={child.code}
                                        to={child.route}
                                        style={{
                                            color: location.pathname === child.route ? '#e94560' : '#aaa',
                                            textDecoration: 'none',
                                            display: 'block',
                                            padding: '8px 10px 8px 20px',
                                            borderRadius: '4px',
                                            background: location.pathname === child.route ? 'rgba(233, 69, 96, 0.1)' : 'transparent',
                                            fontSize: '13px'
                                        }}
                                    >
                                        {child.label}
                                    </Link>
                                ))}

                                {/* If no children, show module link directly */}
                                {(!module.children || module.children.length === 0) && (
                                    <Link
                                        to={module.route}
                                        style={{
                                            color: location.pathname === module.route ? '#e94560' : '#aaa',
                                            textDecoration: 'none',
                                            display: 'block',
                                            padding: '8px 10px 8px 20px'
                                        }}
                                    >
                                        {module.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main style={{
                    flex: 1,
                    padding: '20px',
                    overflowY: 'auto',
                    background: '#f5f5f5'
                }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
