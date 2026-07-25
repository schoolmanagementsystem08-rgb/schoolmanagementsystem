import axios from 'axios';

const base = import.meta.env.VITE_API_URL;
const api = axios.create({
  baseURL: base ? `${base}/api` : '/api',
});

// Mock Clerk token injection
// In a real app, this would use a hook or context
export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export default api;
