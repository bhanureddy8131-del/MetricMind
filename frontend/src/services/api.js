import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:8001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ======================================================
// AUTH TOKEN
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
// ERROR HANDLING
// ======================================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status

    if (status === 401) {
      localStorage.removeItem('metricmind_token')
      localStorage.removeItem('metricmind_user')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    let message = 'Unable to reach MetricMind backend.'

    if (error?.response?.data?.detail) {
      message =
        typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : 'Request failed.'
    } else if (error?.message) {
      message = error.message
    }

    return Promise.reject(new Error(message))
  }
)

// ======================================================
// METRICMIND API
// ======================================================

export const apiService = {

  // ----------------------------------------------------
  // HEALTH
  // ----------------------------------------------------

  health() {
    return api.get('/health')
  },

  // ----------------------------------------------------
  // AUTHENTICATION
  // ----------------------------------------------------

  login(email, password) {
    return api.post('/v1/auth/login', {
      email,
      password,
    })
  },

  register(full_name, username, email, password) {
    return api.post('/v1/auth/register', {
      full_name,
      username,
      email,
      password,
    })
  },

  logout() {
    return api.post('/v1/auth/logout')
  },

  getCurrentUser() {
    return api.get('/v1/auth/me')
  },

  // ----------------------------------------------------
  // SEMANTIC LAYER
  // ----------------------------------------------------

  metrics() {
    return api.get('/metrics')
  },

  dimensions() {
    return api.get('/dimensions')
  },

  // ----------------------------------------------------
  // NATURAL LANGUAGE QUERY
  // ----------------------------------------------------

  query(question) {
    return api.post('/query', {
      question,
    })
  },

  // ----------------------------------------------------
  // DATASET
  // ----------------------------------------------------

  uploadDataset(file, onUploadProgress) {
    const formData = new FormData()

    formData.append('file', file)

    return api.post('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    })
  },

  getDatasets() {
    return api.get('/datasets')
  },

  getActiveDataset() {
    return api.get('/datasets/active')
  },

  activateDataset(datasetId) {
    return api.post(`/datasets/${datasetId}/activate`)
  },

  deleteDataset(datasetId) {
    return api.delete(`/datasets/${datasetId}`)
  },

  getDataset(datasetId) {
    return api.get(`/datasets/${datasetId}`)
  },

  // ----------------------------------------------------
  // DATA
  // ----------------------------------------------------

  getSalesData(page = 1, pageSize = 25, filters = {}) {
    return api.get('/v1/data', {
      params: {
        page,
        page_size: pageSize,
        ...filters,
      },
    })
  },

  createSalesRecord(record) {
    return api.post('/v1/data', record)
  },

  updateSalesRecord(rowId, record) {
    return api.put(`/v1/data/${rowId}`, record)
  },

  deleteSalesRecord(rowId) {
    return api.delete(`/v1/data/${rowId}`)
  },

  // ----------------------------------------------------
  // SQL
  // ----------------------------------------------------

  generateSql(payload) {
    return api.post('/sql/generate', payload)
  },

  validateSql(sql) {
    return api.post('/sql/validate', {
      sql,
    })
  },

  // ----------------------------------------------------
  // AGENT
  // ----------------------------------------------------

  agentIntent(question) {
    return api.post('/agent/intent', {
      question,
    })
  },

  agentTools() {
    return api.get('/agent/tools')
  },

  // ----------------------------------------------------
  // ANALYSIS
  // ----------------------------------------------------

  analyze(data, metrics, dimensions) {
    return api.post('/analysis', {
      data,
      metrics,
      dimensions,
    })
  },

  // ----------------------------------------------------
  // LOAD DATA
  // ----------------------------------------------------

  loadData(filePath = null, overwrite = false) {
    return api.post('/data/load', {
      file_path: filePath,
      overwrite,
    })
  },
}

export default api