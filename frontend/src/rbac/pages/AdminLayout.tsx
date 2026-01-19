import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { modules: navModules, loading, error } = useNavigation();

    const handleLogout = async () => {
        await logout();
        navigate('/rbac/login');
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div>Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                {error}
                <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="admin-header__title">RBAC System</div>
                <div className="admin-header__actions">
                    <Link to="/rbac/profile" className="admin-header__link">
                        {user?.fullName || user?.username || 'User'}
                    </Link>
                    <button onClick={handleLogout} className="btn btn--danger">
                        Logout
                    </button>
                </div>
            </header>

            <div className="admin-body">
                <aside className="admin-sidebar">
                    <nav>
                        <div className="admin-sidebar__profile">
                            <Link
                                to="/rbac/profile"
                                className={`admin-sidebar__link ${location.pathname === '/rbac/profile' ? 'admin-sidebar__link--active' : ''}`}
                            >
                                My Profile
                            </Link>
                        </div>

                        {navModules.map(module => (
                            <div key={module.code} className="admin-sidebar__nav-section">
                                <div className="admin-sidebar__nav-header">
                                    {module.label}
                                </div>

                                {module.children && module.children.map(child => (
                                    <Link
                                        key={child.code}
                                        to={child.route}
                                        className={`admin-sidebar__link admin-sidebar__link--nested ${location.pathname === child.route ? 'admin-sidebar__link--active' : ''}`}
                                    >
                                        {child.label}
                                    </Link>
                                ))}

                                {(!module.children || module.children.length === 0) && (
                                    <Link
                                        to={module.route}
                                        className={`admin-sidebar__link admin-sidebar__link--nested ${location.pathname === module.route ? 'admin-sidebar__link--active' : ''}`}
                                    >
                                        {module.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>

                <main className="admin-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
