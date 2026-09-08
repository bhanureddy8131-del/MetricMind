import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:8001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add authentication token
api.interceptors.request.use(
  function (config) {
    var token = localStorage.getItem('metricmind_token')

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = 'Bearer ' + token
    }

    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

// Handle errors
api.interceptors.response.use(
  function (response) {
    return response
  },
  function (error) {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('metricmind_token')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    var message = 'Unable to reach MetricMind backend'

    if (
      error.response &&
      error.response.data &&
      typeof error.response.data.detail === 'string'
    ) {
      message = error.response.data.detail
    } else if (error.message) {
      message = error.message
    }

    return Promise.reject(new Error(message))
  }
)

// ======================================================
// METRICMIND API SERVICE
// ======================================================

export const apiService = {

  // Health
  health: function () {
    return api.get('/health')
  },

  status: function () {
    return api.get('/status')
  },

  // Authentication
  login: function (email, password) {
    return api.post('/v1/auth/login', {
      email: email,
      password: password,
    })
  },

  register: function (full_name, username, email, password) {
    return api.post('/v1/auth/register', {
      full_name: full_name,
      username: username,
      email: email,
      password: password,
    })
  },

  logout: function () {
    return api.post('/v1/auth/logout')
  },

  getCurrentUser: function () {
    return api.get('/v1/auth/me')
  },

  refreshToken: function () {
    return api.post('/v1/auth/refresh')
  },

  // Metrics
  metrics: function () {
    return api.get('/metrics')
  },

  dimensions: function () {
    return api.get('/dimensions')
  },

  query: function (question) {
    return api.post('/query', {
      question: question,
    })
  },

  uploadDataset: function (file, onUploadProgress) {
    var formData = new FormData()
    formData.append('file', file)
    return api.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onUploadProgress,
    })
  },

  getDatasets: function () { return api.get('/datasets') },
  getActiveDataset: function () { return api.get('/datasets/active') },
  activateDataset: function (datasetId) { return api.post('/datasets/' + datasetId + '/activate') },
  deleteDataset: function (datasetId) { return api.delete('/datasets/' + datasetId) },

  // SQL
  generateSql: function (payload) {
    return api.post('/sql/generate', payload)
  },

  validateSql: function (sql) {
    return api.post('/sql/validate', {
      sql: sql,
    })
  },

  // Agent
  agentIntent: function (question) {
    return api.post('/agent/intent', {
      question: question,
    })
  },

  agentTools: function () {
    return api.get('/agent/tools')
  },

  // Analysis
  analyze: function (data, metrics, dimensions) {
    return api.post('/analysis', {
      data: data,
      metrics: metrics,
      dimensions: dimensions,
    })
  },

  // Sales Data
  getSalesData: function (page, pageSize, filters) {
    page = page || 1
    pageSize = pageSize || 25
    filters = filters || {}

    return api.get('/v1/data', {
      params: Object.assign(
        {
          page: page,
          page_size: pageSize,
        },
        filters
      ),
    })
  },

  createSalesRecord: function (record) {
    return api.post('/v1/data', record)
  },

  updateSalesRecord: function (rowId, record) {
    return api.put('/v1/data/' + rowId, record)
  },

  deleteSalesRecord: function (rowId) {
    return api.delete('/v1/data/' + rowId)
  },

  // Analytics
  getDashboardKPIs: function (filters) {
    filters = filters || {}

    return api.get('/v1/analytics/kpis', {
      params: filters,
    })
  },

  getSalesByRegion: function (filters) {
    filters = filters || {}

    return api.get('/v1/analytics/sales-by-region', {
      params: filters,
    })
  },

  getSalesByCategory: function (filters) {
    filters = filters || {}

    return api.get('/v1/analytics/sales-by-category', {
      params: filters,
    })
  },

  getTopProducts: function (limit, filters) {
    limit = limit || 10
    filters = filters || {}

    return api.get('/v1/analytics/top-products', {
      params: Object.assign(
        {
          limit: limit,
        },
        filters
      ),
    })
  },

  getSalesTrend: function (period, filters) {
    period = period || 'month'
    filters = filters || {}

    return api.get('/v1/analytics/sales-trend', {
      params: Object.assign(
        {
          period: period,
        },
        filters
      ),
    })
  },

  // Load Data
  loadData: function (filePath, overwrite) {
    if (filePath === undefined) {
      filePath = null
    }

    if (overwrite === undefined) {
      overwrite = false
    }

    return api.post('/data/load', {
      file_path: filePath,
      overwrite: overwrite,
    })
  },
}

export default api