import axios from 'axios';
import authService from './authService';

// Safely resolve the base URL from Vite env at runtime.
// In some production deployments the env var may be missing or malformed
// (for example someone accidentally set it to the string "token").
// If the value looks invalid we fall back to the same-origin relative path
// so requests target the hosting domain instead of trying to resolve a
// nonsense hostname (which causes ERR_NAME_NOT_RESOLVED in the browser).
const rawBase = import.meta.env.VITE_API_BASE_URL;
let baseURL = '';
if (rawBase && typeof rawBase === 'string') {
  // Accept only absolute URLs that include a scheme (http:// or https://)
  if (rawBase.includes('://')) {
    baseURL = rawBase;
  } else {
    // Malformed value — warn during runtime and use same-origin requests
    // rather than treating it as a hostname.
    // eslint-disable-next-line no-console
    console.warn('VITE_API_BASE_URL appears malformed, falling back to same-origin requests:', rawBase);
    baseURL = '';
  }
}

const api = axios.create({ baseURL });

api.interceptors.request.use(
  (config) => {
    // Prefer authService.getToken() which checks multiple storage keys
    const token = typeof authService.getToken === 'function' ? authService.getToken() : localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear tokens from known keys and redirect to login
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {}
      window.location.href = '#/login';
    }
    return Promise.reject(error);
  }
);

export default api;