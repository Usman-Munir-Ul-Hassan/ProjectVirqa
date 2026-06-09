/**
 * Runtime configuration helper.
 * Reads from window.__RUNTIME_CONFIG__ (injected at container start),
 * falls back to Vite build-time env vars, then to localhost defaults.
 */
const getConfig = () => window.__RUNTIME_CONFIG__ || {};

export const getApiUrl = () =>
  getConfig().VITE_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000/api/v1';

export const getSocketUrl = () =>
  getConfig().VITE_SOCKET_URL ||
  import.meta.env.VITE_SOCKET_URL ||
  'http://localhost:8000';

export const getGroqApiKey = () =>
  getConfig().VITE_GROQ_API_KEY ||
  import.meta.env.VITE_GROQ_API_KEY ||
  '';
