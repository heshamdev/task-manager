import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    // Basic validation to check if token looks like a valid JWT
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Clear malformed token
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      console.warn("Malformed JWT token detected and cleared");
    }
  }

  // Add current view context for better logging
  const currentPath = window.location.pathname;
  let currentView = 'unknown';

  if (currentPath.includes('/login')) currentView = 'login';
  else if (currentPath.includes('/register')) currentView = 'register';
  else if (currentPath.includes('/admin')) currentView = 'admin';
  else if (currentPath.includes('/tasks') || currentPath === '/') currentView = 'tasks';

  config.headers['X-Current-View'] = currentView;

  return config;
});

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid tokens and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Only redirect if not already on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
