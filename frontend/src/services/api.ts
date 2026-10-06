import axios from 'axios';

const obterBaseURL = () => {
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
};

export const api = axios.create({
  baseURL: obterBaseURL(),
  timeout: 10000,
});

// Anexa o Token JWT automaticamente em toda requisição
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rh_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Se a API responder 401 (Não autorizado), limpa e redireciona pro login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('rh_token');
      localStorage.removeItem('rh_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);