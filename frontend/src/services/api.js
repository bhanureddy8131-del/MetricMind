import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add JWT token
api.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem('metricmind_token')

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

// Handle API errors
api.interceptors.response.use(
  function (response) {
    return response
  },
  function (error) {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('metricmind_token')

        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }

      const detail = error.response.data
        ? error.response.data.detail
        : null

      const message =
        typeof detail === 'string'
          ? detail
          : 'MetricMind backend returned an error.'

      return Promise.reject(new Error(message))
    }

    if (error.request) {
      return Promise.reject(
        new Error(
          'Cannot connect to MetricMind backend. Make sure the backend is running on port 8001.'
        )
      )
    }

    return Promise.reject(
      new Error('Unable to send request to MetricMind backend.')
    )
  }
)

export const apiService = {
  // ---------------------------------
  // SYSTEM
  // ---------------------------------

  health: function () {
    return api.get('/health')
  },

  metrics: function () {
    return api.get('/metrics')
  },

  dimensions: function () {
    return api.get('/dimensions')
  },

  // ---------------------------------
  // AUTH
  // ---------------------------------

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

  // ---------------------------------
  // AI QUERY
  // ---------------------------------

  query: function (question) {
    return api.post('/query', {
      question: question,
    })
  },

  generateSql: function (payload) {
    return api.post('/sql/generate', payload)
  },

  validateSql: function (sql) {
    return api.post('/sql/validate', {
      sql: sql,
    })
  },

  agentIntent: function (question) {
    return api.post('/agent/intent', {
      question: question,
    })
  },

  agentTools: function () {
    return api.get('/agent/tools')
  },

  analyze: function (data, metrics, dimensions) {
    return api.post('/analysis', {
      data: data,
      metrics: metrics,
      dimensions: dimensions,
    })
  },

  // ---------------------------------
  // DATA
  // ---------------------------------

  getSalesData: function (page, pageSize, filters) {
    const currentPage = page || 1
    const currentPageSize = pageSize || 25
    const currentFilters = filters || {}

    return api.get('/v1/data', {
      params: {
        page: currentPage,
        page_size: currentPageSize,
        ...currentFilters,
      },
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

  // ---------------------------------
  // OPTIONAL ANALYTICS ENDPOINTS
  // ---------------------------------

  getDashboardKPIs: function (filters) {
    return api.get('/v1/analytics/kpis', {
      params: filters || {},
    })
  },

  getSalesByRegion: function (filters) {
    return api.get('/v1/analytics/sales-by-region', {
      params: filters || {},
    })
  },

  getSalesByCategory: function (filters) {
    return api.get('/v1/analytics/sales-by-category', {
      params: filters || {},
    })
  },

  getTopProducts: function (limit, filters) {
    return api.get('/v1/analytics/top-products', {
      params: {
        limit: limit || 10,
        ...(filters || {}),
      },
    })
  },

  getSalesTrend: function (period, filters) {
    return api.get('/v1/analytics/sales-trend', {
      params: {
        period: period || 'month',
        ...(filters || {}),
      },
    })
  },

  // ---------------------------------
  // DATA LOADING
  // ---------------------------------

  loadData: function (filePath, overwrite) {
    return api.post('/data/load', {
      file_path: filePath || null,
      overwrite: overwrite || false,
    })
  },
}

export default api