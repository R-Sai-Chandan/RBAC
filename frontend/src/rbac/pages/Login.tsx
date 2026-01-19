import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData.username, formData.password);
            navigate('/rbac');
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Login failed';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-box">
                <h1>RBAC System Login</h1>

                {error && (
                    <div className="login-message login-message--error">
                        {error}
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Email / Username</label>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        required
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="form-input"
                    />
                </div>

                <button type="submit" disabled={loading} className="btn w-full">
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}
