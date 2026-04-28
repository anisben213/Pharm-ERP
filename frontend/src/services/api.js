import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// External handlers wired in by app providers (avoids React import in this module).
let onUnauthorized = null;
let onGlobalError = null;
export const setApiHandlers = ({ unauthorized, globalError } = {}) => {
  onUnauthorized = unauthorized;
  onGlobalError = globalError;
};

// Auto-refresh access token on 401
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;

    if (status === 401 && !original._retry && !String(original.url || '').includes('/auth/')) {
      original._retry = true;
      try {
        refreshing = refreshing || api.post('/auth/refresh');
        await refreshing;
        refreshing = null;
        return api(original);
      } catch {
        refreshing = null;
        if (onUnauthorized) onUnauthorized();
      }
    } else if (status === 401) {
      if (onUnauthorized) onUnauthorized();
    } else if (!error.response) {
      if (onGlobalError) onGlobalError('No connection. Please check your network.');
    } else if (status >= 500) {
      if (onGlobalError) onGlobalError('Server error, please try again.');
    }
    return Promise.reject(error);
  }
);

export default api;
