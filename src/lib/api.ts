import axios from 'axios';

const base = import.meta.env.VITE_API_URL;
const api = axios.create({
  baseURL: base ? `${base}/api` : '/api',
});

console.log('[API] VITE_API_URL:', base || '(not set)');
console.log('[API] baseURL:', api.defaults.baseURL);

export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} ->`, error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
