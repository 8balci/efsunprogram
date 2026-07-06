import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('efsun_token') || sessionStorage.getItem('efsun_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('efsun_token');
      sessionStorage.removeItem('efsun_token');
      if (window.location.pathname !== '/giris') {
        window.location.href = '/giris';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
