import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use((response) => response, (error) => {
  const detail = error.response?.data?.detail
  return Promise.reject(new Error(typeof detail === 'string' ? detail : 'Unable to reach MetricMind backend'))
})

export const apiService = {
  health: () => api.get('/health'),
  status: () => api.get('/status'),
  metrics: () => api.get('/metrics'),
  dimensions: () => api.get('/dimensions'),
  query: (question) => api.post('/query', { question }),
  generateSql: (payload) => api.post('/sql/generate', payload),
  validateSql: (sql) => api.post('/sql/validate', { sql }),
  agentIntent: (question) => api.post('/agent/intent', { question }),
  agentTools: () => api.get('/agent/tools'),
  loadData: (payload = {}) => api.post('/data/load', payload),
}

export default api
