import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

export default api;
