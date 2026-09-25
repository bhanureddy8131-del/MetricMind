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
    const token = localStorage.getItem('metricmind_token')

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

/* =========================================================
   RESPONSE INTERCEPTOR
   ========================================================= */

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('metricmind_token')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

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


  /* =======================================================
     METRICS
     ======================================================= */

  getMetrics() {
    return api.get('/metrics')
  },


  /* =======================================================
     DASHBOARD
     ======================================================= */

  getDashboardKPIs() {
    return api.get('/dashboard/kpis')
  },

  getSalesByRegion() {
    return api.get('/dashboard/sales-by-region')
  },

  getSalesByCategory() {
    return api.get('/dashboard/sales-by-category')
  },

  getSalesTrend(period = 'month') {
    return api.get('/dashboard/sales-trend', {
      params: {
        period,
      },
    })
  },

  getTopProducts() {
    return api.get('/dashboard/top-products')
  },


  /* =======================================================
     AI QUERY
     ======================================================= */

  query(data) {
    return api.post('/query', data)
  },


  /* =======================================================
     DATASETS
     ======================================================= */

  // GET /api/datasets
  getDatasets() {
    return api.get('/datasets')
  },

  // GET /api/datasets/active
  getActiveDataset() {
    return api.get('/datasets/active')
  },

  // POST /api/datasets/upload
  uploadDataset(file, onUploadProgress) {
    const formData = new FormData()

    formData.append('file', file)

    return api.post(
      '/datasets/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },

        onUploadProgress,
      }
    )
  },

  // POST /api/datasets/{id}/activate
  activateDataset(datasetId) {
    return api.post(
      `/datasets/${datasetId}/activate`
    )
  },

  // DELETE /api/datasets/{id}
  deleteDataset(datasetId) {
    return api.delete(
      `/datasets/${datasetId}`
    )
  },


  /* =======================================================
     SINGLE DATASET / LEGACY
     ======================================================= */

  getDataset(params = {}) {
    return api.get('/dataset', {
      params,
    })
  },

  addBusinessData(data) {
    return api.post('/dataset', data)
  },


  /* =======================================================
     REPORTS
     ======================================================= */

  getReports() {
    return api.get('/reports')
  },

  generateReport(data = {}) {
    return api.post(
      '/reports/generate',
      data
    )
  },


  /* =======================================================
     GENERIC GET
     ======================================================= */

  get(url, config = {}) {
    return api.get(url, config)
  },


  /* =======================================================
     GENERIC POST
     ======================================================= */

  post(url, data, config = {}) {
    return api.post(url, data, config)
  },


  /* =======================================================
     GENERIC PUT
     ======================================================= */

  put(url, data, config = {}) {
    return api.put(url, data, config)
  },


  /* =======================================================
     GENERIC DELETE
     ======================================================= */

  delete(url, config = {}) {
    return api.delete(url, config)
  },
}

/* =========================================================
   EXPORTS
   ========================================================= */

export { api }

export { apiService }

export default apiService