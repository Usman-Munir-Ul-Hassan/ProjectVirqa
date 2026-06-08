import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true, // Crucial for sending and receiving HTTP-only cookies securely
});

export const get = (url, config) => api.get(url, config);
export default api;
