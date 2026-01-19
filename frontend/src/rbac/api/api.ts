import axios from 'axios';

const api = axios.create({
    baseURL: '/rbac', // Proxy handles this to http://localhost:3000/rbac
    withCredentials: true, // Send Cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: (Cleaned up legacy org context)
api.interceptors.request.use((config) => {
    return config;
});

// Response Interceptor: Handle 401 (Session Expired / Invalid)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Session invalid or expired - redirect to login
            localStorage.removeItem('user');
            // Use correct /rbac/login path
            window.location.href = '/rbac/login';
        }
        return Promise.reject(error);
    }
);

export default api;
