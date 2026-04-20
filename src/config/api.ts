const configuredApiBase = String(import.meta.env.VITE_API_URL || '').trim();

export const LOCAL_API_BASE_URL = 'http://localhost:5000/api';
export const DEV_PROXY_API_BASE_URL = '/api';
export const DEFAULT_PRODUCTION_API_BASE_URL = 'https://urbanease-backend-suham.onrender.com/api';

export const API_BASE_URL = import.meta.env.DEV
  ? DEV_PROXY_API_BASE_URL
  : configuredApiBase || DEFAULT_PRODUCTION_API_BASE_URL;

export const API_TARGET_HINT = import.meta.env.DEV
  ? 'the local backend via the Vite /api proxy (http://localhost:5000)'
  : API_BASE_URL;
