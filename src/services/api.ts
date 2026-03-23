import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // When sending FormData (file uploads), delete Content-Type
        // so the browser sets multipart/form-data with proper boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle auth errors and logging
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error("API Call Failed:", error.response?.status, error.config?.url);
        if (error.response && error.response.status === 401) {
            // Auto-logout on unauthorized
            console.log("Session expired, redirecting to login...");
            localStorage.removeItem('adminToken');
            // Check if we are not already on the login page to avoid loops
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
