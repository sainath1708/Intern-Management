import axios from 'axios';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../utils/constants';

export class ApiClientError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors || [];
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;

    if (status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('qubenix:unauthorized'));
    }

    let message = payload?.message;
    if (!message) {
      if (error.code === 'ECONNABORTED') message = 'The request timed out. Please try again.';
      else if (!error.response) message = 'Unable to reach the server. Check that the API is running.';
      else message = 'Something went wrong. Please try again.';
    }

    return Promise.reject(
      new ApiClientError(message, {
        status,
        errors: Array.isArray(payload?.errors) ? payload.errors : [],
      }),
    );
  },
);

export default api;
