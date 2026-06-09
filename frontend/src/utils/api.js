import axios from 'axios';
import { getApiUrl } from './runtimeConfig.js';

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true, // Crucial for sending and receiving HTTP-only cookies securely
});

export const get = (url, config) => api.get(url, config);
export default api;
