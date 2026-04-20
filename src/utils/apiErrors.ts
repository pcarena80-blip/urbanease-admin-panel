import axios from 'axios';
import { API_TARGET_HINT } from '../config/api';

const extractServerMessage = (data: unknown): string | null => {
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const payload = data as Record<string, unknown>;

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error.trim();
  }

  return null;
};

export const getApiErrorMessage = (error: unknown, fallback = 'Request failed.') => {
  if (axios.isAxiosError(error)) {
    const serverMessage = extractServerMessage(error.response?.data);
    if (serverMessage) {
      return serverMessage;
    }

    if (error.code === 'ECONNABORTED') {
      return 'The request timed out before the backend responded.';
    }

    if (!error.response) {
      return `Could not reach ${API_TARGET_HINT}. Start \`D:\\Desktop\\UE\\backend\` with \`npm start\`, or update \`VITE_API_URL\`.`;
    }

    return `Request failed with status ${error.response.status}.`;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
};
