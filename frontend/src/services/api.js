import axios from 'axios';

const isLocalhost =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Use localhost when the app is served locally; otherwise fall back to the deployed backend.
const API_BASE_URL =
  process.env.REACT_APP_API_URL || (isLocalhost ? 'http://localhost:8080/api' : 'https://codingstar.onrender.com/api');

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
  getRandom: () => api.get('/problems/random'),
  getByDifficulty: (difficulty, page = 0, size = 20) =>
    api.get(`/problems/difficulty/${difficulty}?page=${page}&size=${size}`),
  search: (query, page = 0, size = 20) =>
    api.get(`/problems/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`),
  getByCategory: (prefix, page = 0, size = 50, difficulty = null) => {
    let url = `/problems/category?prefix=${encodeURIComponent(prefix)}&page=${page}&size=${size}`;
    if (difficulty) url += `&difficulty=${difficulty}`;
    return api.get(url);
  },
  getCategories: () => api.get('/problems/categories'),
  create: (data) => api.post('/problems', data),
  update: (id, data) => api.put(`/problems/${id}`, data),
  delete: (id) => api.delete(`/problems/${id}`),
};

// Submissions API
export const submissionsAPI = {
  submit: (data) => api.post('/submissions', data),
  run: (data) => api.post('/submissions/run', data),
  getMy: (page = 0, size = 20) =>
    api.get(`/submissions/my?page=${page}&size=${size}`),
  getAll: (page = 0, size = 20) =>
    api.get(`/submissions/all?page=${page}&size=${size}`),
  getById: (id) => api.get(`/submissions/${id}`),
  getByProblem: (problemId, page = 0, size = 20) =>
    api.get(`/submissions/problem/${problemId}?page=${page}&size=${size}`),
  getStats: (problemId, executionTimeMs, memoryUsedKb) =>
    api.get(`/submissions/stats/${problemId}?executionTimeMs=${executionTimeMs || 0}&memoryUsedKb=${memoryUsedKb || 0}`),
};

// Leaderboard API
export const leaderboardAPI = {
  get: () => api.get('/leaderboard'),
};

// Contest API
export const contestAPI = {
  getAll: () => api.get('/contests'),
  getActive: () => api.get('/contests/active'),
  getById: (id) => api.get(`/contests/${id}`),
  register: (id) => api.post(`/contests/${id}/register`),
  isRegistered: (id) => api.get(`/contests/${id}/registered`),
  getRankings: (id) => api.get(`/contests/${id}/rankings`),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  getCount: () => api.get('/users/count'),
};

// Problem Notes API
export const problemNotesAPI = {
  save: (data) => api.post('/problem-notes', data),
  get: (problemId) => api.get(`/problem-notes/problem/${problemId}`),
  getAll: () => api.get('/problem-notes/my-notes'),
  hasNote: (problemId) => api.get(`/problem-notes/has-note/${problemId}`),
  delete: (problemId) => api.delete(`/problem-notes/problem/${problemId}`),
};

export default api;
