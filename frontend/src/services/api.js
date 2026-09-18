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

// ======================================================
// REQUEST INTERCEPTOR
// ======================================================

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

// ======================================================
// RESPONSE INTERCEPTOR
// ======================================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('metricmind_token')

      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register'
      ) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// ======================================================
// API SERVICE
// ======================================================

export const apiService = {

  // HEALTH
  health() {
    return api.get('/health')
  },

  // AUTH
  login(data) {
    return api.post('/v1/auth/login', data)
  },

  register(data) {
    return api.post('/v1/auth/register', data)
  },

  me() {
    return api.get('/v1/auth/me')
  },

  logout() {
    return api.post('/v1/auth/logout')
  },

  // METRICS
  metrics() {
    return api.get('/metrics')
  },

  dimensions() {
    return api.get('/dimensions')
  },

  // AI QUERY
  query(data) {
    let question = ''

    if (typeof data === 'string') {
      question = data
    } else if (data && typeof data === 'object') {
      question = String(data.question || '')
    } else {
      throw new Error(
        'Query must be a string or an object containing question'
      )
    }

    if (!question.trim()) {
      throw new Error('Question cannot be empty')
    }

    return api.post('/query', {
      question: question.trim(),
    })
  },

  // ====================================================
  // DASHBOARD KPI
  // ====================================================

  getDashboardKPIs() {
    return api.get('/dashboard/kpis')
  },

  // ====================================================
  // REGION
  // ====================================================

  getSalesByRegion() {
    return apiService.query(
      'What is total revenue by region?'
    )
  },

  // ====================================================
  // CATEGORY
  // ====================================================

  getSalesByCategory() {
    return apiService.query(
      'What is total revenue by category?'
    )
  },

  // ====================================================
  // TOP PRODUCTS
  // ====================================================

  getTopProducts() {
    return apiService.query(
      'Show top 10 products by profit'
    )
  },

  // ====================================================
  // SALES TREND
  // ====================================================

  getSalesTrend(period = 'month') {
    let question = 'Show monthly revenue trend'

    if (period === 'week') {
      question = 'Show weekly revenue trend'
    }

    if (period === 'day') {
      question = 'Show daily revenue trend'
    }

    if (period === 'year') {
      question = 'Show yearly revenue trend'
    }

    return apiService.query(question)
  },

  // ====================================================
  // BUSINESS DATA
  // ====================================================

  addBusinessData(data) {
    return api.post('/data', data)
  },

  getBusinessData() {
    return api.get('/data')
  },

  deleteBusinessData(id) {
    return api.delete(`/data/${id}`)
  },

  // ====================================================
  // DATASET
  // ====================================================

  uploadDataset(formData) {
    return api.post('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  getDatasets() {
    return api.get('/datasets')
  },

  getActiveDataset() {
    return api.get('/datasets/active')
  },

  getDataset(id) {
    return api.get(`/datasets/${id}`)
  },

  activateDataset(id) {
    return api.post(`/datasets/${id}/activate`)
  },

  deleteDataset(id) {
    return api.delete(`/datasets/${id}`)
  },
}

export default apiService