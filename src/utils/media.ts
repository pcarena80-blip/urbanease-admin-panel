import { API_BASE_URL } from '../config/api';

const ABSOLUTE_MEDIA_PATTERN = /^(https?:|data:|file:|blob:)/i;

export const resolveMediaUrl = (path?: string | null) => {
  const rawValue = String(path || '').trim();
  if (!rawValue) {
    return '';
  }

  if (ABSOLUTE_MEDIA_PATTERN.test(rawValue)) {
    return rawValue;
  }

  const normalizedPath = rawValue
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  if (!normalizedPath) {
    return '';
  }

  return `${API_BASE_URL.replace(/\/$/, '')}/media?path=${encodeURIComponent(normalizedPath)}`;
};
