import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('metricmind_token')

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail

    if (status === 401) {
      localStorage.removeItem('metricmind_token')
    }

    let message = 'Unable to connect to MetricMind backend.'

    if (typeof detail === 'string') {
      message = detail
    } else if (error.code === 'ERR_NETWORK') {
      message =
        'Cannot connect to MetricMind backend. Make sure backend is running on port 8001.'
    }

    return Promise.reject(new Error(message))
  }
)

export const apiService = {
  health: () => api.get('/health'),

  metrics: () => api.get('/metrics'),

  dimensions: () => api.get('/dimensions'),

  query: (question) =>
    api.post('/query', {
      question,
    }),

  login: (email, password) =>
    api.post('/v1/auth/login', {
      email,
      password,
    }),

  register: (full_name, username, email, password) =>
    api.post('/v1/auth/register', {
      full_name,
      username,
      email,
      password,
    }),

  logout: () =>
    api.post('/v1/auth/logout'),

  getCurrentUser: () =>
    api.get('/v1/auth/me'),

  getDashboardKPIs: (filters = {}) =>
    api.get('/v1/analytics/kpis', {
      params: filters,
    }),

  getSalesByRegion: (filters = {}) =>
    api.get('/v1/analytics/sales-by-region', {
      params: filters,
    }),

  getSalesByCategory: (filters = {}) =>
    api.get('/v1/analytics/sales-by-category', {
      params: filters,
    }),

  getTopProducts: (limit = 10, filters = {}) =>
    api.get('/v1/analytics/top-products', {
      params: {
        limit,
        ...filters,
      },
    }),

  getSalesTrend: (period = 'month', filters = {}) =>
    api.get('/v1/analytics/sales-trend', {
      params: {
        period,
        ...filters,
      },
    }),

  getSalesData: (page = 1, pageSize = 25, filters = {}) =>
    api.get('/v1/data', {
      params: {
        page,
        page_size: pageSize,
        ...filters,
      },
    }),

  createSalesRecord: (record) =>
    api.post('/v1/data', record),

  updateSalesRecord: (rowId, record) =>
    api.put(`/v1/data/${rowId}`, record),

  deleteSalesRecord: (rowId) =>
    api.delete(`/v1/data/${rowId}`),

  loadData: (filePath = null, overwrite = false) =>
    api.post('/data/load', {
      file_path: filePath,
      overwrite,
    }),
}

export default api