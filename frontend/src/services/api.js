import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

// Problems API
export const problemsAPI = {
  getAll: (page = 0, size = 20, sortBy = 'id') =>
    api.get(`/problems?page=${page}&size=${size}&sortBy=${sortBy}`),
  getById: (id) => api.get(`/problems/${id}`),
  getByDifficulty: (difficulty, page = 0, size = 20) =>
    api.get(`/problems/difficulty/${difficulty}?page=${page}&size=${size}`),
  search: (query, page = 0, size = 20) =>
    api.get(`/problems/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`),
  create: (data) => api.post('/problems', data),
  update: (id, data) => api.put(`/problems/${id}`, data),
  delete: (id) => api.delete(`/problems/${id}`),
};

// Submissions API
export const submissionsAPI = {
  submit: (data) => api.post('/submissions', data),
  getMy: (page = 0, size = 20) =>
    api.get(`/submissions/my?page=${page}&size=${size}`),
  getById: (id) => api.get(`/submissions/${id}`),
  getByProblem: (problemId, page = 0, size = 20) =>
    api.get(`/submissions/problem/${problemId}?page=${page}&size=${size}`),
};

// Leaderboard API
export const leaderboardAPI = {
  get: () => api.get('/leaderboard'),
};

export default api;
