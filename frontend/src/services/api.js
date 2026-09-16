import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
})

// ======================================================
// TOKEN
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
    console.error(
      'MetricMind API error:',
      error?.response?.status,
      error?.response?.data || error.message
    )

    if (error?.response?.status === 401) {
      localStorage.removeItem('metricmind_token')
      localStorage.removeItem('metricmind_user')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    const detail = error?.response?.data?.detail

    const message =
      typeof detail === 'string'
        ? detail
        : error?.message ||
          'Unable to connect to MetricMind backend.'

    return Promise.reject(
      new Error(message)
    )
  }
)

// ======================================================
// QUERY
// IMPORTANT:
// Return the COMPLETE backend response.
// ======================================================

async function runQuery(question) {
  const response = await api.post('/query', {
    question,
  })

  console.log(
    'MetricMind query:',
    question,
    response.data
  )

  return response.data
}

// ======================================================
// EXTRACT NUMBER FROM QUERY RESULT
// ======================================================

function extractValue(result) {
  if (!result) {
    return 0
  }

  // Backend returns:
  // {
  //   data: [...]
  //   answer: "..."
  // }

  if (Array.isArray(result.data)) {
    if (result.data.length === 0) {
      return 0
    }

    const firstRow = result.data[0]

    if (
      typeof firstRow === 'number'
    ) {
      return firstRow
    }

    if (
      firstRow &&
      typeof firstRow === 'object'
    ) {
      const values =
        Object.values(firstRow)

      // Prefer numeric values
      for (const value of values) {
        if (
          typeof value === 'number' &&
          Number.isFinite(value)
        ) {
          return value
        }

        if (
          typeof value === 'string' &&
          value.trim() !== '' &&
          Number.isFinite(Number(value))
        ) {
          return Number(value)
        }
      }
    }
  }

  // Sometimes data itself is numeric
  if (
    typeof result.data === 'number'
  ) {
    return result.data
  }

  // Fallback to answer text
  if (
    typeof result.answer === 'string'
  ) {
    const match =
      result.answer.match(
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
// NORMALIZE QUERY DATA
// ======================================================

function normalizeQueryData(result) {
  if (!result) {
    return []
  }

  if (Array.isArray(result.data)) {
    return result.data
  }

  return []
}

// ======================================================
// API SERVICE
// ======================================================

export const apiService = {

  // ----------------------------------------------------
  // HEALTH
  // ----------------------------------------------------

  health() {
    return api.get('/health')
  },

  // ----------------------------------------------------
  // AUTH
  // ----------------------------------------------------

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

  getCurrentUser() {
    return api.get('/v1/auth/me')
  },

  logout() {
    return api.post('/v1/auth/logout')
  },

  // ----------------------------------------------------
  // METRICS
  // ----------------------------------------------------

  metrics() {
    return api.get('/metrics')
  },

  dimensions() {
    return api.get('/dimensions')
  },

  // ----------------------------------------------------
  // AI QUERY
  // ----------------------------------------------------

  query(question) {
    return api.post('/query', {
      question,
    })
  },

  // ----------------------------------------------------
  // DASHBOARD KPIs
  // ----------------------------------------------------

  async getDashboardKPIs() {
    const [
      revenueResult,
      profitResult,
      ordersResult,
      customersResult,
    ] = await Promise.all([
      runQuery(
        'What is our total revenue?'
      ),

      runQuery(
        'What is our total profit?'
      ),

      runQuery(
        'How many orders do we have?'
      ),

      runQuery(
        'How many customers do we have?'
      ),
    ])

    const result = {
      total_revenue:
        extractValue(revenueResult),

      total_profit:
        extractValue(profitResult),

      total_orders:
        extractValue(ordersResult),

      total_customers:
        extractValue(customersResult),
    }

    console.log(
      'MetricMind Dashboard KPIs:',
      result
    )

    return {
      data: result,
    }
  },

  // ----------------------------------------------------
  // REVENUE BY REGION
  // ----------------------------------------------------

  async getSalesByRegion() {
    const result = await runQuery(
      'What is total revenue by region?'
    )

    return {
      data: normalizeQueryData(result),
    }
  },

  // ----------------------------------------------------
  // REVENUE BY CATEGORY
  // ----------------------------------------------------

  async getSalesByCategory() {
    const result = await runQuery(
      'What is total revenue by category?'
    )

    return {
      data: normalizeQueryData(result),
    }
  },

  // ----------------------------------------------------
  // TOP PRODUCTS
  // ----------------------------------------------------

  async getTopProducts() {
    const result = await runQuery(
      'Show top 10 products by profit'
    )

    return {
      data: normalizeQueryData(result),
    }
  },

  // ----------------------------------------------------
  // REVENUE TREND
  // ----------------------------------------------------

  async getSalesTrend() {
    const result = await runQuery(
      'What is total revenue by month?'
    )

    return {
      data: normalizeQueryData(result),
    }
  },

  // ----------------------------------------------------
  // DATASET UPLOAD
  // ----------------------------------------------------

  uploadDataset(
    file,
    onUploadProgress
  ) {
    const token = getToken()

    if (!token) {
      return Promise.reject(
        new Error(
          'No login token found. Please log in again.'
        )
      )
    }

    const formData = new FormData()

    formData.append(
      'file',
      file
    )

    return api.post(
      '/datasets/upload',
      formData,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        onUploadProgress,

        timeout: 120000,
      }
    )
  },

  // ----------------------------------------------------
  // DATASETS
  // ----------------------------------------------------

  getDatasets() {
    return api.get('/datasets')
  },

  getActiveDataset() {
    return api.get(
      '/datasets/active'
    )
  },

  getDataset(datasetId) {
    return api.get(
      `/datasets/${datasetId}`
    )
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
}

export default api