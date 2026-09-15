import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
})

// ======================================================
// GET JWT TOKEN
// ======================================================

function getToken() {
  return localStorage.getItem('metricmind_token')
}

// ======================================================
// REQUEST INTERCEPTOR
// ======================================================

api.interceptors.request.use(
  (config) => {
    const token = getToken()

    if (token) {
      config.headers = config.headers || {}

      config.headers.Authorization = `Bearer ${token}`

      console.log(
        'MetricMind API:',
        config.method?.toUpperCase(),
        config.url,
        'JWT attached'
      )
    } else {
      console.warn(
        'MetricMind API: No JWT token found'
      )
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ======================================================
// RESPONSE INTERCEPTOR
// ======================================================

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error(
      'MetricMind API error:',
      error?.response?.status,
      error?.response?.data || error.message
    )

    const status = error?.response?.status

    if (status === 401) {
      localStorage.removeItem('metricmind_token')
      localStorage.removeItem('metricmind_user')

      if (
        window.location.pathname !== '/login'
      ) {
        window.location.href = '/login'
      }
    }

    let message =
      'Unable to connect to MetricMind backend.'

    if (error?.response?.data?.detail) {
      message =
        typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : 'Request failed.'
    } else if (error?.message) {
      message = error.message
    }

    return Promise.reject(
      new Error(message)
    )
  }
)

// ======================================================
// QUERY HELPER
// ======================================================

async function runQuery(question) {
  const response = await api.post('/query', {
    question,
  })

  return response.data
}

// ======================================================
// API SERVICE
// ======================================================

export const apiService = {

  // ====================================================
  // HEALTH
  // ====================================================

  health() {
    return api.get('/health')
  },

  // ====================================================
  // AUTH
  // ====================================================

  login(email, password) {
    return api.post('/v1/auth/login', {
      email: email.trim(),
      password,
    })
  },

  register(
    full_name,
    username,
    email,
    password
  ) {
    return api.post('/v1/auth/register', {
      full_name: full_name.trim(),
      username: username.trim(),
      email: email.trim(),
      password,
    })
  },

  logout() {
    return api.post('/v1/auth/logout')
  },

  getCurrentUser() {
    return api.get('/v1/auth/me')
  },

  // ====================================================
  // METRICS
  // ====================================================

  metrics() {
    return api.get('/metrics')
  },

  dimensions() {
    return api.get('/dimensions')
  },

  // ====================================================
  // NATURAL LANGUAGE QUERY
  // ====================================================

  query(question) {
    return api.post('/query', {
      question,
    })
  },

  // ====================================================
  // DASHBOARD KPIs
  // ====================================================

  async getDashboardKPIs() {
    const [
      revenue,
      profit,
      orders,
      customers,
    ] = await Promise.all([
      runQuery('What is our total revenue?'),
      runQuery('What is our total profit?'),
      runQuery('How many orders do we have?'),
      runQuery('How many customers do we have?'),
    ])

    return {
      data: {
        totalRevenue: extractValue(revenue),
        totalProfit: extractValue(profit),
        totalOrders: extractValue(orders),
        customers: extractValue(customers),
      },
    }
  },

  // ====================================================
  // DASHBOARD CHARTS
  // ====================================================

  async getSalesByRegion() {
    const response = await runQuery(
      'What is total revenue by region?'
    )

    return {
      data: normalizeQueryData(response),
    }
  },

  async getSalesByCategory() {
    const response = await runQuery(
      'What is total revenue by category?'
    )

    return {
      data: normalizeQueryData(response),
    }
  },

  async getTopProducts() {
    const response = await runQuery(
      'Show top 10 products by profit'
    )

    return {
      data: normalizeQueryData(response),
    }
  },

  async getSalesTrend() {
    const response = await runQuery(
      'What is total revenue by month?'
    )

    return {
      data: normalizeQueryData(response),
    }
  },

  // ====================================================
  // DATASET UPLOAD
  // ====================================================

  uploadDataset(file, onUploadProgress) {

    const token = getToken()

    if (!token) {
      return Promise.reject(
        new Error(
          'No login token found. Please log in again.'
        )
      )
    }

    const formData = new FormData()

    formData.append('file', file)

    console.log(
      'Uploading dataset:',
      file.name
    )

    console.log(
      'JWT available:',
      Boolean(token)
    )

    return api.post(
      '/datasets/upload',
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT manually set Content-Type.
          // Axios will create the multipart boundary.
        },

        onUploadProgress,

        timeout: 120000,
      }
    )
  },

  // ====================================================
  // DATASETS
  // ====================================================

  getDatasets() {
    return api.get('/datasets')
  },

  getActiveDataset() {
    return api.get('/datasets/active')
  },

  activateDataset(datasetId) {
    return api.post(
      `/datasets/${datasetId}/activate`
    )
  },

  deleteDataset(datasetId) {
    return api.delete(
      `/datasets/${datasetId}`
    )
  },

  getDataset(datasetId) {
    return api.get(
      `/datasets/${datasetId}`
    )
  },
}

// ======================================================
// VALUE EXTRACTION
// ======================================================

function extractValue(response) {

  if (!response) {
    return 0
  }

  if (Array.isArray(response.data)) {

    if (response.data.length === 0) {
      return 0
    }

    const first = response.data[0]

    if (typeof first === 'number') {
      return first
    }

    if (
      first &&
      typeof first === 'object'
    ) {

      const values = Object.values(first)

      for (const value of values) {

        if (typeof value === 'number') {
          return value
        }

        if (
          typeof value === 'string' &&
          !isNaN(Number(value))
        ) {
          return Number(value)
        }
      }
    }
  }

  if (typeof response.data === 'number') {
    return response.data
  }

  if (
    typeof response.answer === 'string'
  ) {

    const match =
      response.answer.match(
        /-?\d[\d,]*(?:\.\d+)?/
      )

    if (match) {
      return Number(
        match[0].replace(/,/g, '')
      )
    }
  }

  return 0
}

// ======================================================
// NORMALIZE CHART DATA
// ======================================================

function normalizeQueryData(response) {

  if (!response) {
    return []
  }

  if (Array.isArray(response.data)) {
    return response.data
  }

  if (Array.isArray(response)) {
    return response
  }

  return []
}

export default api