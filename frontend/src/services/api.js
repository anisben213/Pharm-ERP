import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let onUnauthorized = null;
let onGlobalError = null;
export function setApiHandlers({ unauthorized, globalError } = {}) {
  if (unauthorized) onUnauthorized = unauthorized;
  if (globalError) onGlobalError = globalError;
}

let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const cfg = error.config || {};
    const status = error.response?.status;
    if (!error.response) { onGlobalError?.('Network error'); return Promise.reject(error); }
    if (status === 401 && !cfg._retry && !cfg.url?.includes('/auth/')) {
      cfg._retry = true;
      try {
        if (!refreshing) refreshing = api.post('/auth/refresh').finally(() => { refreshing = null; });
        await refreshing;
        return api.request(cfg);
      } catch (_) {
        onUnauthorized?.();
      }
    }
    if (status >= 500) onGlobalError?.(error.response.data?.message || 'Server error');
    return Promise.reject(error);
  }
);

export default api;
