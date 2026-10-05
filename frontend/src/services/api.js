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


/* =========================================================
   AUTH TOKEN
   ========================================================= */

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('metricmind_token')

    if (token) {
      config.headers =
        config.headers || {}

      config.headers.Authorization =
        `Bearer ${token}`
    }

    return config
  },

  (error) =>
    Promise.reject(error)
)


/* =========================================================
   RESPONSE INTERCEPTOR
   ========================================================= */

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error?.response?.status === 401
    ) {
      localStorage.removeItem(
        'metricmind_token'
      )

      if (
        window.location.pathname !==
        '/login'
      ) {
        window.location.href =
          '/login'
      }
    }

    return Promise.reject(error)
  }
)


/* =========================================================
   DASHBOARD FILTER HELPER
   ========================================================= */

function cleanDashboardFilters(
  filters = {}
) {
  const params = {}

  if (filters.dateFrom) {
    params.date_from =
      filters.dateFrom
  }

  if (filters.dateTo) {
    params.date_to =
      filters.dateTo
  }

  if (filters.region) {
    params.region =
      filters.region
  }

  if (filters.category) {
    params.category =
      filters.category
  }

  if (filters.shippingMode) {
    params.shipping_mode =
      filters.shippingMode
  }

  return params
}


/* =========================================================
   API SERVICE
   ========================================================= */

const apiService = {

  /* =======================================================
     HEALTH
     ======================================================= */

  health() {
    return api.get('/health')
  },


  /* =======================================================
     AUTH
     ======================================================= */

  login(data) {
    return api.post(
      '/v1/auth/login',
      data
    )
  },

  register(data) {
    return api.post(
      '/v1/auth/register',
      data
    )
  },

  me() {
    return api.get(
      '/v1/auth/me'
    )
  },

  logout() {
    return api.post(
      '/v1/auth/logout'
    )
  },


  /* =======================================================
     METRICS
     ======================================================= */

  getMetrics() {
    return api.get('/metrics')
  },


  /* =======================================================
     DASHBOARD
     ======================================================= */

  getDashboardKPIs(
    filters = {}
  ) {
    return api.get(
      '/dashboard/kpis',
      {
        params:
          cleanDashboardFilters(
            filters
          ),
      }
    )
  },


  getSalesByRegion(
    filters = {}
  ) {
    return api.get(
      '/dashboard/sales-by-region',
      {
        params:
          cleanDashboardFilters(
            filters
          ),
      }
    )
  },


  getSalesByCategory(
    filters = {}
  ) {
    return api.get(
      '/dashboard/sales-by-category',
      {
        params:
          cleanDashboardFilters(
            filters
          ),
      }
    )
  },


  getSalesTrend(
    period = 'month',
    filters = {}
  ) {
    return api.get(
      '/dashboard/sales-trend',
      {
        params: {
          period,
          ...cleanDashboardFilters(
            filters
          ),
        },
      }
    )
  },


  getTopProducts(
    filters = {}
  ) {
    return api.get(
      '/dashboard/top-products',
      {
        params:
          cleanDashboardFilters(
            filters
          ),
      }
    )
  },


  /* =======================================================
     AI QUERY
     ======================================================= */

  query(data) {
    return api.post(
      '/query',
      data
    )
  },


  /* =======================================================
     DATASETS
     ======================================================= */

  getDatasets() {
    return api.get(
      '/datasets'
    )
  },

  getActiveDataset() {
    return api.get(
      '/datasets/active'
    )
  },

  uploadDataset(
    file,
    onUploadProgress
  ) {
    const formData =
      new FormData()

    formData.append(
      'file',
      file
    )

    return api.post(
      '/datasets/upload',
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },

        onUploadProgress,
      }
    )
  },

  activateDataset(
    datasetId
  ) {
    return api.post(
      `/datasets/${datasetId}/activate`
    )
  },

  deleteDataset(
    datasetId
  ) {
    return api.delete(
      `/datasets/${datasetId}`
    )
  },


  /* =======================================================
     SINGLE DATASET / LEGACY
     ======================================================= */

  getDataset(
    params = {}
  ) {
    return api.get(
      '/dataset',
      {
        params,
      }
    )
  },

  addBusinessData(data) {
    return api.post(
      '/dataset',
      data
    )
  },


  /* =======================================================
     REPORTS
     ======================================================= */

  getReports() {
    return api.get(
      '/reports'
    )
  },

  generateReport(
    data = {}
  ) {
    return api.post(
      '/reports/generate',
      data
    )
  },


  /* =======================================================
     GENERIC GET
     ======================================================= */

  get(
    url,
    config = {}
  ) {
    return api.get(
      url,
      config
    )
  },


  /* =======================================================
     GENERIC POST
     ======================================================= */

  post(
    url,
    data,
    config = {}
  ) {
    return api.post(
      url,
      data,
      config
    )
  },


  /* =======================================================
     GENERIC PUT
     ======================================================= */

  put(
    url,
    data,
    config = {}
  ) {
    return api.put(
      url,
      data,
      config
    )
  },


  /* =======================================================
     GENERIC DELETE
     ======================================================= */

  delete(
    url,
    config = {}
  ) {
    return api.delete(
      url,
      config
    )
  },
}


/* =========================================================
   EXPORTS
   ========================================================= */

export {
  api,
  apiService,
}

export default apiService