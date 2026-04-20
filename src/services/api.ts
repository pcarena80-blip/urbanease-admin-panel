import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const summarizeResponseBody = (data: unknown) => {
    if (Array.isArray(data)) {
        return { type: 'array', count: data.length };
    }

    if (!data || typeof data !== 'object') {
        return { type: typeof data };
    }

    const payload = data as Record<string, unknown>;
    return {
        type: 'object',
        keys: Object.keys(payload).slice(0, 12),
        ...(Array.isArray(payload.items) ? { items: payload.items.length } : {}),
        ...(Array.isArray(payload.messages) ? { messages: payload.messages.length } : {}),
        ...(typeof payload.total === 'number' ? { total: payload.total } : {}),
    };
};

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        config.headers = config.headers || {};
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
        console.debug('[admin-api] response', {
            method: response.config?.method?.toUpperCase() || 'GET',
            baseURL: response.config?.baseURL || API_BASE_URL,
            url: response.config?.url || '',
            status: response.status,
            summary: summarizeResponseBody(response.data),
        });
        return response;
    },
    (error) => {
        console.error('[admin-api] request failed', {
            method: error.config?.method?.toUpperCase() || 'GET',
            baseURL: error.config?.baseURL || API_BASE_URL,
            url: error.config?.url || '',
            status: error.response?.status || null,
            code: error.code || '',
            message: error.message,
            hasResponse: Boolean(error.response),
        });
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
