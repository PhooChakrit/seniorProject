import axios from 'axios';

const apiBasePath = import.meta.env.VITE_API_BASE_PATH || '/api';
const appBasePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: apiBasePath,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Keep public pages (dashboard/jbrowse) accessible without login.
      // Redirect to login only when user is on protected analysis routes.
      const currentPath = window.location.pathname;
      const analysisPath = `${appBasePath}/analysis`;
      const loginPath = `${appBasePath}/login`;
      const shouldRedirectToLogin =
        currentPath.startsWith(analysisPath) && currentPath !== loginPath;

      if (shouldRedirectToLogin) {
        localStorage.removeItem('token');
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
