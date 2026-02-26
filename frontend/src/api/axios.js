import axios from 'axios';

// ── Base Axios instance ───────────────────────────────────────────────────────
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// ── Request interceptor: Attach JWT token if present ─────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('lms_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: Handle 401 globally ────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear storage and redirect to login
            localStorage.removeItem('lms_token');
            localStorage.removeItem('lms_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
