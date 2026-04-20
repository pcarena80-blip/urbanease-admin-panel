const configuredApiBase = String(import.meta.env.VITE_API_URL || '').trim();

export const LOCAL_API_BASE_URL = 'http://localhost:5000/api';
export const DEV_PROXY_API_BASE_URL = '/api';
export const PRODUCTION_PROXY_API_BASE_URL = '/api';
export const DEFAULT_PRODUCTION_API_BASE_URL = 'https://urbanease-backend-suham.onrender.com/api';

const runtimeHostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isHostedProductionRuntime = Boolean(
  runtimeHostname &&
  !/^localhost$|^127\.0\.0\.1$/i.test(runtimeHostname),
);

const normalizeProductionApiBase = (value: string) => {
  const sanitized = value.trim().replace(/\/+$/, '');

  if (!sanitized) {
    return DEFAULT_PRODUCTION_API_BASE_URL;
  }

  if (/duckdns\.org/i.test(sanitized)) {
    return DEFAULT_PRODUCTION_API_BASE_URL;
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/api)?$/i.test(sanitized)) {
    return DEFAULT_PRODUCTION_API_BASE_URL;
  }

  return sanitized;
};

export const API_BASE_URL = import.meta.env.DEV
  ? DEV_PROXY_API_BASE_URL
  : isHostedProductionRuntime
    ? PRODUCTION_PROXY_API_BASE_URL
    : normalizeProductionApiBase(configuredApiBase);

export const API_TARGET_HINT = import.meta.env.DEV
  ? 'the local backend via the Vite /api proxy (http://localhost:5000)'
  : API_BASE_URL === PRODUCTION_PROXY_API_BASE_URL
    ? 'the Vercel /api proxy to the UrbanEase AWS backend'
  : API_BASE_URL === DEFAULT_PRODUCTION_API_BASE_URL
    ? 'the UrbanEase production backend on Render'
    : API_BASE_URL;
