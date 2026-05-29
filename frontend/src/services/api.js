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

function firstPresent(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function normalizeTestcase(testcase) {
  if (!testcase || typeof testcase !== 'object') return testcase;
  return {
    ...testcase,
    output: firstPresent(testcase.output, testcase.expectedOutput, testcase.expected_output),
    isSample: firstPresent(testcase.isSample, testcase.is_sample, testcase.sample, false),
    explanation: firstPresent(testcase.explanation, testcase.explanationText, testcase.explanation_text),
  };
}

function normalizeProblem(problem) {
  if (!problem || typeof problem !== 'object') return problem;

  const testcases = Array.isArray(problem.testcases)
    ? problem.testcases.map(normalizeTestcase)
    : Array.isArray(problem.testCases)
      ? problem.testCases.map(normalizeTestcase)
      : undefined;

  const sampleInput = firstPresent(problem.sampleInput, problem.sample_input, testcases?.find((tc) => tc?.isSample)?.input);
  const sampleOutput = firstPresent(problem.sampleOutput, problem.sample_output, testcases?.find((tc) => tc?.isSample)?.output);
  const sampleExplanation = firstPresent(
    problem.sampleExplanation,
    problem.sample_explanation,
    testcases?.find((tc) => tc?.isSample)?.explanation
  );

  return {
    ...problem,
    sampleInput,
    sampleOutput,
    sampleExplanation,
    inputFormat: firstPresent(problem.inputFormat, problem.input_format),
    outputFormat: firstPresent(problem.outputFormat, problem.output_format),
    timeLimitMs: firstPresent(problem.timeLimitMs, problem.time_limit_ms),
    memoryLimitMb: firstPresent(problem.memoryLimitMb, problem.memory_limit_mb),
    totalSubmissions: firstPresent(problem.totalSubmissions, problem.total_submissions, 0),
    acceptedSubmissions: firstPresent(problem.acceptedSubmissions, problem.accepted_submissions, 0),
    acceptanceRate: firstPresent(problem.acceptanceRate, problem.acceptance_rate, 0),
    updatedAt: firstPresent(problem.updatedAt, problem.updated_at),
    testcases,
  };
}

function normalizeSubmission(submission) {
  if (!submission || typeof submission !== 'object') return submission;
  return {
    ...submission,
    testCasesPassed: firstPresent(submission.testCasesPassed, submission.test_cases_passed, 0),
    totalTestCases: firstPresent(submission.totalTestCases, submission.total_test_cases, 0),
    scoreEarned: firstPresent(submission.scoreEarned, submission.score_earned, 0),
    starsEarned: firstPresent(submission.starsEarned, submission.stars_earned, 0),
    executionTimeMs: firstPresent(submission.executionTimeMs, submission.execution_time_ms),
    memoryUsedKb: firstPresent(submission.memoryUsedKb, submission.memory_used_kb),
    errorMessage: firstPresent(submission.errorMessage, submission.error_message),
    problemTitle: firstPresent(submission.problemTitle, submission.problem_title),
    problemId: firstPresent(submission.problemId, submission.problem_id),
  };
}

function normalizeProblemPage(page) {
  if (!page || typeof page !== 'object') return page;
  const content = Array.isArray(page.content) ? page.content.map(normalizeProblem) : page.content;
  return { ...page, content };
}

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
    api.get(`/problems?page=${page}&size=${size}&sortBy=${sortBy}`).then((response) => ({
      ...response,
      data: normalizeProblemPage(response.data),
    })),
  getById: (id) => api.get(`/problems/${id}`).then((response) => ({
    ...response,
    data: normalizeProblem(response.data),
  })),
  getRandom: () => api.get('/problems/random').then((response) => ({
    ...response,
    data: normalizeProblem(response.data),
  })),
  getByDifficulty: (difficulty, page = 0, size = 20) =>
    api.get(`/problems/difficulty/${difficulty}?page=${page}&size=${size}`).then((response) => ({
      ...response,
      data: normalizeProblemPage(response.data),
    })),
  search: (query, page = 0, size = 20) =>
    api.get(`/problems/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`).then((response) => ({
      ...response,
      data: normalizeProblemPage(response.data),
    })),
  getByCategory: (prefix, page = 0, size = 50, difficulty = null) => {
    let url = `/problems/category?prefix=${encodeURIComponent(prefix)}&page=${page}&size=${size}`;
    if (difficulty) url += `&difficulty=${difficulty}`;
    return api.get(url).then((response) => ({
      ...response,
      data: normalizeProblemPage(response.data),
    }));
  },
  getCategories: () => api.get('/problems/categories'),
  create: (data) => api.post('/problems', data),
  update: (id, data) => api.put(`/problems/${id}`, data),
  delete: (id) => api.delete(`/problems/${id}`),
};

// Submissions API
export const submissionsAPI = {
  submit: (data) => api.post('/submissions', data).then((response) => ({
    ...response,
    data: normalizeSubmission(response.data),
  })),
  run: (data) => api.post('/submissions/run', data).then((response) => ({
    ...response,
    data: normalizeSubmission(response.data),
  })),
  getMy: (page = 0, size = 20) =>
    api.get(`/submissions/my?page=${page}&size=${size}`).then((response) => ({
      ...response,
      data: { ...response.data, content: Array.isArray(response.data?.content) ? response.data.content.map(normalizeSubmission) : response.data?.content },
    })),
  getAll: (page = 0, size = 20) =>
    api.get(`/submissions/all?page=${page}&size=${size}`).then((response) => ({
      ...response,
      data: { ...response.data, content: Array.isArray(response.data?.content) ? response.data.content.map(normalizeSubmission) : response.data?.content },
    })),
  getById: (id) => api.get(`/submissions/${id}`).then((response) => ({
    ...response,
    data: normalizeSubmission(response.data),
  })),
  getByProblem: (problemId, page = 0, size = 20) =>
    api.get(`/submissions/problem/${problemId}?page=${page}&size=${size}`).then((response) => ({
      ...response,
      data: { ...response.data, content: Array.isArray(response.data?.content) ? response.data.content.map(normalizeSubmission) : response.data?.content },
    })),
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
