import { useEffect, useMemo, useState } from 'react'

import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  Database,
  FileBarChart,
  Home,
  Moon,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import apiService from '../services/api'
import { useTheme } from '../context/ThemeContext'
import './Dashboard.css'


/* =========================================================
   FALLBACK DATA
   ========================================================= */

const fallbackRegion = [
  { name: 'West', value: 42000 },
  { name: 'East', value: 35000 },
  { name: 'Central', value: 28000 },
  { name: 'South', value: 22000 },
]

const fallbackCategory = [
  { name: 'Technology', value: 35 },
  { name: 'Furniture', value: 30 },
  { name: 'Office Supplies', value: 25 },
  { name: 'Other', value: 10 },
]

const fallbackTrend = [
  { name: 'Jan', revenue: 18000 },
  { name: 'Feb', revenue: 23000 },
  { name: 'Mar', revenue: 21000 },
  { name: 'Apr', revenue: 29000 },
  { name: 'May', revenue: 26000 },
  { name: 'Jun', revenue: 34000 },
  { name: 'Jul', revenue: 39000 },
  { name: 'Aug', revenue: 44000 },
]

const fallbackProducts = [
  { name: 'Product A', value: 12400 },
  { name: 'Product B', value: 9800 },
  { name: 'Product C', value: 8700 },
  { name: 'Product D', value: 7900 },
  { name: 'Product E', value: 7100 },
]


/* =========================================================
   HELPERS
   ========================================================= */

function formatCurrency(value) {
  const number = Number(value || 0)

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(number)
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(
    Number(value || 0)
  )
}

function extractRows(response) {
  const payload = response?.data

  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  if (Array.isArray(payload?.rows)) {
    return payload.rows
  }

  if (Array.isArray(payload?.result)) {
    return payload.result
  }

  if (Array.isArray(payload?.items)) {
    return payload.items
  }

  return []
}

function normalizeRegion(rows) {
  if (!rows.length) {
    return fallbackRegion
  }

  return rows
    .map((row) => ({
      name:
        row.region ??
        row.Region ??
        row.name ??
        row.Name ??
        'Unknown',

      value:
        Number(
          row.revenue ??
          row.Revenue ??
          row.sales ??
          row.Sales ??
          row.value ??
          row.Value ??
          0
        ) || 0,
    }))
    .filter((item) => item.name)
}

function normalizeCategory(rows) {
  if (!rows.length) {
    return fallbackCategory
  }

  return rows
    .map((row) => ({
      name:
        row.category ??
        row.Category ??
        row.name ??
        row.Name ??
        'Unknown',

      value:
        Number(
          row.revenue ??
          row.Revenue ??
          row.sales ??
          row.Sales ??
          row.value ??
          row.Value ??
          0
        ) || 0,
    }))
    .filter((item) => item.name)
}

function normalizeTrend(rows) {
  if (!rows.length) {
    return fallbackTrend
  }

  return rows.map((row, index) => ({
    name:
      row.month ??
      row.Month ??
      row.period ??
      row.Period ??
      row.date ??
      row.Date ??
      row.name ??
      row.Name ??
      `Period ${index + 1}`,

    revenue:
      Number(
        row.revenue ??
        row.Revenue ??
        row.sales ??
        row.Sales ??
        row.value ??
        row.Value ??
        0
      ) || 0,
  }))
}

function normalizeProducts(rows) {
  if (!rows.length) {
    return fallbackProducts
  }

  return rows
    .map((row) => ({
      name:
        row.product_name ??
        row.productName ??
        row.Product ??
        row.name ??
        row.Name ??
        'Unknown Product',

      value:
        Number(
          row.revenue ??
          row.Revenue ??
          row.sales ??
          row.Sales ??
          row.profit ??
          row.Profit ??
          row.value ??
          row.Value ??
          0
        ) || 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
}


/* =========================================================
   DASHBOARD
   ========================================================= */

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()

  const { dark, toggleDarkMode } = useTheme()

  const [loading, setLoading] = useState(true)
  const [apiOnline, setApiOnline] = useState(false)
  const [search, setSearch] = useState('')

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    region: '',
    category: '',
    paymentMethod: '',
    shippingMode: '',
  })

  const [kpis, setKpis] = useState({
    revenue: 0,
    profit: 0,
    orders: 0,
    customers: 0,
  })

  const [regionData, setRegionData] =
    useState(fallbackRegion)

  const [categoryData, setCategoryData] =
    useState(fallbackCategory)

  const [trendData, setTrendData] =
    useState(fallbackTrend)

  const [productData, setProductData] =
    useState(fallbackProducts)

  const [notificationOpen, setNotificationOpen] =
    useState(false)

  const [copilotQuestion, setCopilotQuestion] =
    useState('')

  const [copilotAnswer, setCopilotAnswer] =
    useState(
      'Ask me anything about your business data.'
    )

  const [copilotLoading, setCopilotLoading] =
    useState(false)

  const [forecastMonths, setForecastMonths] =
    useState(3)

  const [revenueGoal, setRevenueGoal] =
    useState(250000)

  const [profitGoal, setProfitGoal] =
    useState(50000)


  /* =======================================================
     ACTIVE SIDEBAR
     ======================================================= */

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }

    return location.pathname.startsWith(path)
  }


  /* =======================================================
     LOAD DASHBOARD
     ======================================================= */

  const loadDashboard = async () => {
    setLoading(true)

    try {
      const healthResponse =
        await apiService.health()

      if (
        healthResponse?.status >= 200 &&
        healthResponse?.status < 300
      ) {
        setApiOnline(true)
      } else {
        setApiOnline(false)
      }
    } catch (error) {
      console.error(
        'Health check failed:',
        error
      )

      setApiOnline(false)
    }

    try {
      const [
        kpiResponse,
        regionResponse,
        categoryResponse,
        trendResponse,
        productResponse,
      ] = await Promise.allSettled([
        apiService.getDashboardKPIs(),
        apiService.getSalesByRegion(),
        apiService.getSalesByCategory(),
        apiService.getSalesTrend('month'),
        apiService.getTopProducts(),
      ])

      if (kpiResponse.status === 'fulfilled') {
        const payload =
          kpiResponse.value?.data || {}

        const data =
          payload?.data &&
          typeof payload.data === 'object'
            ? payload.data
            : payload

        setKpis({
          revenue:
            Number(
              data.revenue ??
              data.total_revenue ??
              data.sales ??
              0
            ),

          profit:
            Number(
              data.profit ??
              data.total_profit ??
              0
            ),

          orders:
            Number(
              data.orders ??
              data.total_orders ??
              0
            ),

          customers:
            Number(
              data.customers ??
              data.total_customers ??
              0
            ),
        })
      }

      if (regionResponse.status === 'fulfilled') {
        setRegionData(
          normalizeRegion(
            extractRows(regionResponse.value)
          )
        )
      }

      if (categoryResponse.status === 'fulfilled') {
        setCategoryData(
          normalizeCategory(
            extractRows(categoryResponse.value)
          )
        )
      }

      if (trendResponse.status === 'fulfilled') {
        setTrendData(
          normalizeTrend(
            extractRows(trendResponse.value)
          )
        )
      }

      if (productResponse.status === 'fulfilled') {
        setProductData(
          normalizeProducts(
            extractRows(productResponse.value)
          )
        )
      }
    } catch (error) {
      console.error(
        'Dashboard loading error:',
        error
      )
    } finally {
      setLoading(false)
    }
  }


  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    loadDashboard()
  }, [])


  /* =======================================================
     DASHBOARD FILTERS
     ======================================================= */

  const handleFilterChange = (event) => {
    const { name, value } = event.target

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      region: '',
      category: '',
      paymentMethod: '',
      shippingMode: '',
    })
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  /* =======================================================
     SEARCH
     ======================================================= */

  const handleSearch = (event) => {
    event.preventDefault()

    const value = search.trim()

    if (!value) {
      return
    }

    navigate(
      `/ai-query?q=${encodeURIComponent(value)}`
    )
  }


  /* =======================================================
     AI COPILOT
     ======================================================= */

  const askCopilot = async (
    question = copilotQuestion
  ) => {
    const cleanQuestion =
      question.trim()

    if (!cleanQuestion) {
      return
    }

    setCopilotLoading(true)

    setCopilotAnswer(
      'Analyzing your business data...'
    )

    try {
      const response =
        await apiService.query({
          question: cleanQuestion,
        })

      const answer =
        response?.data?.answer ||
        response?.data?.message ||
        response?.data?.result ||
        'I found the requested information.'

      setCopilotAnswer(answer)
    } catch (error) {
      console.error(
        'Copilot error:',
        error
      )

      setCopilotAnswer(
        'I could not connect to the analytics engine. Please check the backend and try again.'
      )
    } finally {
      setCopilotLoading(false)
    }
  }


  /* =======================================================
     DERIVED DATA
     ======================================================= */

  const categoryTotal = useMemo(() => {
    return categoryData.reduce(
      (total, item) =>
        total + Number(item.value || 0),
      0
    )
  }, [categoryData])


  const averageRevenue = useMemo(() => {
    if (!trendData.length) {
      return 0
    }

    return (
      trendData.reduce(
        (sum, item) =>
          sum + Number(item.revenue || 0),
        0
      ) / trendData.length
    )
  }, [trendData])


  const lastRevenue = useMemo(() => {
    return Number(
      trendData[trendData.length - 1]?.revenue || 0
    )
  }, [trendData])


  const previousRevenue = useMemo(() => {
    if (trendData.length < 2) {
      return lastRevenue
    }

    return Number(
      trendData[trendData.length - 2]?.revenue || 0
    )
  }, [trendData, lastRevenue])


  const revenueChange = useMemo(() => {
    if (!previousRevenue) {
      return 0
    }

    return (
      ((lastRevenue - previousRevenue) /
        previousRevenue) *
      100
    )
  }, [lastRevenue, previousRevenue])


  /* =======================================================
     FORECAST
     ======================================================= */

  const forecastData = useMemo(() => {
    const historical =
      trendData.map((item) => ({
        name: item.name,
        actual: Number(item.revenue || 0),
        forecast: null,
      }))

    if (!historical.length) {
      return historical
    }

    const base =
      averageRevenue || lastRevenue || 0

    const growth =
      revenueChange / 100

    const safeGrowth =
      Number.isFinite(growth)
        ? Math.max(
            -0.15,
            Math.min(0.15, growth)
          )
        : 0

    let current =
      lastRevenue || base

    const forecast = []

    for (let i = 1; i <= forecastMonths; i++) {
      current =
        current *
        (1 + safeGrowth)

      forecast.push({
        name: `F+${i}`,
        actual: null,
        forecast: Math.round(
          Math.max(0, current)
        ),
      })
    }

    return [
      ...historical,
      ...forecast,
    ]
  }, [
    trendData,
    averageRevenue,
    lastRevenue,
    revenueChange,
    forecastMonths,
  ])


  const forecastAccuracy = useMemo(() => {
    if (!trendData.length) {
      return 0
    }

    const recentValues =
      trendData
        .slice(-3)
        .map((item) =>
          Number(item.revenue || 0)
        )

    if (!recentValues.length) {
      return 0
    }

    const average =
      recentValues.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / recentValues.length

    if (!average) {
      return 0
    }

    const variation =
      recentValues.reduce(
        (sum, value) =>
          sum +
          Math.abs(value - average),
        0
      ) /
      recentValues.length

    return Math.max(
      70,
      Math.min(
        99,
        Math.round(
          100 -
            (variation / average) *
              100
        )
      )
    )
  }, [trendData])


  const projectedRevenue = useMemo(() => {
    const future =
      forecastData
        .filter(
          (item) =>
            item.forecast !== null
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(
              item.forecast || 0
            ),
          0
        )

    return future
  }, [forecastData])


  /* =======================================================
     GOALS
     ======================================================= */

  const revenueGoalProgress =
    revenueGoal > 0
      ? Math.min(
          100,
          (kpis.revenue /
            revenueGoal) *
            100
        )
      : 0

  const profitGoalProgress =
    profitGoal > 0
      ? Math.min(
          100,
          (kpis.profit /
            profitGoal) *
            100
        )
      : 0


  /* =======================================================
     BEST PERFORMERS
     ======================================================= */

  const bestRegion =
    regionData.length
      ? [...regionData].sort(
          (a, b) =>
            b.value - a.value
        )[0]
      : null

  const bestCategory =
    categoryData.length
      ? [...categoryData].sort(
          (a, b) =>
            b.value - a.value
        )[0]
      : null

  const bestProduct =
    productData.length
      ? productData[0]
      : null


  /* =======================================================
     ALERTS
     ======================================================= */

  const alerts = useMemo(() => {
    const result = []

    if (revenueChange < -5) {
      result.push({
        type: 'warning',
        title: 'Revenue Alert',
        text: `Revenue decreased by ${Math.abs(
          revenueChange
        ).toFixed(1)}% compared with the previous period.`,
      })
    }

    if (revenueChange >= 5) {
      result.push({
        type: 'success',
        title: 'Revenue Growth',
        text: `Revenue increased by ${revenueChange.toFixed(
          1
        )}% compared with the previous period.`,
      })
    }

    if (
      kpis.profit < 0
    ) {
      result.push({
        type: 'danger',
        title: 'Profit Alert',
        text: 'Current profit is negative. Review low-margin products and regions.',
      })
    }

    if (
      kpis.revenue > 0 &&
      kpis.profit > 0
    ) {
      const margin =
        (kpis.profit /
          kpis.revenue) *
        100

      if (margin < 10) {
        result.push({
          type: 'warning',
          title: 'Performance Alert',
          text: `Current profit margin is ${margin.toFixed(
            1
          )}%.`,
        })
      }
    }

    if (!result.length) {
      result.push({
        type: 'success',
        title: 'Performance Healthy',
        text: 'No major performance alerts detected from the current dashboard data.',
      })
    }

    return result
  }, [
    revenueChange,
    kpis.profit,
    kpis.revenue,
  ])


  /* =======================================================
     AI INSIGHTS
     ======================================================= */

  const aiInsights = useMemo(() => {
    const insights = []

    if (bestRegion) {
      insights.push(
        `The ${bestRegion.name} region currently contributes the highest regional revenue.`
      )
    }

    if (bestCategory) {
      insights.push(
        `${bestCategory.name} is currently the leading category by revenue.`
      )
    }

    if (bestProduct) {
      insights.push(
        `${bestProduct.name} is the highest-performing product in the current product data.`
      )
    }

    if (revenueChange > 0) {
      insights.push(
        `Revenue is trending upward by approximately ${revenueChange.toFixed(
          1
        )}% versus the previous period.`
      )
    }

    if (!insights.length) {
      insights.push(
        'Add more business data to generate deeper AI insights.'
      )
    }

    return insights.slice(0, 4)
  }, [
    bestRegion,
    bestCategory,
    bestProduct,
    revenueChange,
  ])


  /* =======================================================
     PIE COLORS
     ======================================================= */

  const pieColors = [
    '#3155ff',
    '#7c3aed',
    '#06b6d4',
    '#10b981',
    '#f59e0b',
  ]


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div
      className={
        dark
          ? 'dashboard-shell dashboard-dark'
          : 'dashboard-shell dashboard-light'
      }
    >

      {/* ===================================================
          SIDEBAR
          =================================================== */}

      <aside className="metric-sidebar">

        <div className="metric-logo">
          <div className="metric-logo-mark">
            M
          </div>

          <div>
            <div className="metric-logo-name">
              METRICMIND
            </div>

            <div className="metric-logo-subtitle">
              BUSINESS INTELLIGENCE
            </div>
          </div>
        </div>


        <div className="metric-sidebar-section">
          MAIN
        </div>


        <nav className="metric-sidebar-nav">

          <Link
            to="/"
            className={`metric-sidebar-link ${
              isActive('/')
                ? 'active'
                : ''
            }`}
          >
            <Home size={18} />
            <span>Dashboard</span>
          </Link>


          <Link
            to="/analytics"
            className={`metric-sidebar-link ${
              isActive('/analytics')
                ? 'active'
                : ''
            }`}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </Link>


          <Link
            to="/dataset"
            className={`metric-sidebar-link ${
              isActive('/dataset')
                ? 'active'
                : ''
            }`}
          >
            <Database size={18} />
            <span>Dataset</span>
          </Link>


          <Link
            to="/add-data"
            className={`metric-sidebar-link ${
              isActive('/add-data')
                ? 'active'
                : ''
            }`}
          >
            <Plus size={18} />
            <span>Add Data</span>
          </Link>


          <Link
            to="/ai-query"
            className={`metric-sidebar-link ${
              isActive('/ai-query')
                ? 'active'
                : ''
            }`}
          >
            <Sparkles size={18} />
            <span>AI Query</span>
          </Link>

        </nav>


        <div className="metric-sidebar-section management-title">
          MANAGEMENT
        </div>


        <nav className="metric-sidebar-nav">

          <Link
            to="/reports"
            className={`metric-sidebar-link ${
              isActive('/reports')
                ? 'active'
                : ''
            }`}
          >
            <FileBarChart size={18} />
            <span>Reports</span>
          </Link>


          <Link
            to="/settings"
            className={`metric-sidebar-link ${
              isActive('/settings')
                ? 'active'
                : ''
            }`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>

        </nav>


        <div className="metric-sidebar-bottom">

          <div className="metric-sidebar-status">

            <div className="status-icon">
              <Activity size={15} />
            </div>

            <div>
              <div className="status-title">
                System Status
              </div>

              <div className="status-value">

                <span
                  className={
                    apiOnline
                      ? 'status-dot online'
                      : 'status-dot offline'
                  }
                />

                {apiOnline
                  ? 'API Connected'
                  : 'API Offline'}

              </div>
            </div>

          </div>

        </div>

      </aside>


      {/* ===================================================
          MAIN
          =================================================== */}

      <main className="dashboard-main">

        {/* TOPBAR */}

        <header className="dashboard-topbar">

          <form
            className="dashboard-search"
            onSubmit={handleSearch}
          >

            <Search size={18} />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search or ask MetricMind..."
            />

            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() =>
                  setSearch('')
                }
              >
                <X size={15} />
              </button>
            )}

          </form>


          <div className="dashboard-top-actions">

            <button
              type="button"
              className="icon-button"
              onClick={toggleDarkMode}
              title={
                dark
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
            >
              {dark ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>


            <div className="notification-wrapper">

              <button
                type="button"
                className="icon-button notification-button"
                onClick={() =>
                  setNotificationOpen(
                    (previous) =>
                      !previous
                  )
                }
              >
                <Bell size={18} />

                <span className="notification-dot" />
              </button>


              {notificationOpen && (
                <div className="notification-popover">

                  <div className="notification-header">

                    <strong>
                      Notifications
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        setNotificationOpen(
                          false
                        )
                      }
                    >
                      <X size={15} />
                    </button>

                  </div>


                  {alerts.map(
                    (alert, index) => (
                      <div
                        className="notification-item"
                        key={index}
                      >

                        <div className="notification-item-icon">
                          <AlertCircle size={15} />
                        </div>

                        <div>
                          <strong>
                            {alert.title}
                          </strong>

                          <p>
                            {alert.text}
                          </p>
                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>


            <div className="dashboard-profile">

              <div className="profile-avatar">
                B
              </div>

              <div className="profile-details">
                <strong>
                  MetricMind User
                </strong>

                <span>
                  Administrator
                </span>
              </div>

            </div>

          </div>

        </header>


        {/* CONTENT */}

        <section className="dashboard-content">

          {/* PAGE HEADER */}

          <div className="dashboard-page-header">

            <div>

              <div className="dashboard-eyebrow">
                AI BUSINESS INTELLIGENCE
              </div>

              <h1>
                Executive Dashboard
              </h1>

              <p>
                Monitor performance, discover insights,
                track goals and forecast future business
                results.
              </p>

            </div>


            <div className="dashboard-header-actions">

              <div
                className={
                  apiOnline
                    ? 'api-status connected'
                    : 'api-status disconnected'
                }
              >
                <span />

                {apiOnline
                  ? 'API Connected'
                  : 'Preview Mode'}
              </div>


              <button
                type="button"
                className="dashboard-secondary-button"
                onClick={loadDashboard}
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={
                    loading
                      ? 'spin'
                      : ''
                  }
                />

                Refresh
              </button>


              <Link
                to="/add-data"
                className="dashboard-primary-button"
              >
                <Plus size={16} />
                Add Data
              </Link>

            </div>

          </div>


          {/* =================================================
              ADVANCED DASHBOARD FILTERS
              ================================================= */}

          <section className="dashboard-filter-panel">
            <div className="filter-panel-header">
              <div>
                <span className="panel-eyebrow">FILTERS</span>
                <h2>Dashboard Filters</h2>
                <p>Focus the dashboard on the business data you need.</p>
              </div>

              <button
                type="button"
                className="filter-reset-button"
                onClick={resetFilters}
              >
                <RefreshCw size={15} />
                Reset Filters
              </button>
            </div>

            <div className="dashboard-filter-grid">
              <div className="dashboard-filter-group">
                <label htmlFor="dateFrom">Date From</label>
                <input id="dateFrom" type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
              </div>
              <div className="dashboard-filter-group">
                <label htmlFor="dateTo">Date To</label>
                <input id="dateTo" type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
              </div>
              <div className="dashboard-filter-group">
                <label htmlFor="region">Region</label>
                <select id="region" name="region" value={filters.region} onChange={handleFilterChange}>
                  <option value="">All Regions</option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                </select>
              </div>
              <div className="dashboard-filter-group">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={filters.category} onChange={handleFilterChange}>
                  <option value="">All Categories</option>
                  <option value="Technology">Technology</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Office Supplies">Office Supplies</option>
                </select>
              </div>
              <div className="dashboard-filter-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <select id="paymentMethod" name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange}>
                  <option value="">All Payments</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>
              <div className="dashboard-filter-group">
                <label htmlFor="shippingMode">Shipping Mode</label>
                <select id="shippingMode" name="shippingMode" value={filters.shippingMode} onChange={handleFilterChange}>
                  <option value="">All Shipping</option>
                  <option value="Standard Class">Standard Class</option>
                  <option value="Second Class">Second Class</option>
                  <option value="First Class">First Class</option>
                  <option value="Same Day">Same Day</option>
                </select>
              </div>
            </div>

            <div className="active-filter-status">
              <span className="active-filter-dot" />
              <strong>Filters ready</strong>
              <span>
                {activeFilterCount === 0
                  ? 'Showing all business data'
                  : `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} selected`}
              </span>
            </div>
          </section>

          {/* =================================================
              KPI CARDS
              ================================================= */}

          <div className="dashboard-kpi-grid">

            <div className="dashboard-kpi-card primary">

              <div className="kpi-top">

                <div className="kpi-icon">
                  <TrendingUp size={19} />
                </div>

                <span className="kpi-label">
                  TOTAL REVENUE
                </span>

              </div>

              <div className="kpi-value">
                {loading
                  ? '—'
                  : formatCurrency(
                      kpis.revenue
                    )}
              </div>

              <div className="kpi-footer">

                <span className={
                  revenueChange >= 0
                    ? 'kpi-positive'
                    : 'kpi-negative'
                }>

                  {revenueChange >= 0 ? (
                    <TrendingUp size={13} />
                  ) : (
                    <TrendingDown size={13} />
                  )}

                  {revenueChange >= 0
                    ? `${revenueChange.toFixed(1)}% growth`
                    : `${Math.abs(
                        revenueChange
                      ).toFixed(1)}% decline`}

                </span>

                <span className="kpi-period">
                  Current
                </span>

              </div>

            </div>


            <div className="dashboard-kpi-card">

              <div className="kpi-top">

                <div className="kpi-icon green">
                  <Activity size={19} />
                </div>

                <span className="kpi-label">
                  TOTAL PROFIT
                </span>

              </div>

              <div className="kpi-value">
                {loading
                  ? '—'
                  : formatCurrency(
                      kpis.profit
                    )}
              </div>

              <div className="kpi-footer">

                <span className="kpi-positive">
                  <Activity size={13} />
                  Profit generated
                </span>

                <span className="kpi-period">
                  Current
                </span>

              </div>

            </div>


            <div className="dashboard-kpi-card">

              <div className="kpi-top">

                <div className="kpi-icon purple">
                  <ShoppingCart size={19} />
                </div>

                <span className="kpi-label">
                  TOTAL ORDERS
                </span>

              </div>

              <div className="kpi-value">
                {loading
                  ? '—'
                  : formatNumber(
                      kpis.orders
                    )}
              </div>

              <div className="kpi-footer">

                <span className="kpi-positive">
                  <ShoppingCart size={13} />
                  Orders processed
                </span>

                <span className="kpi-period">
                  Current
                </span>

              </div>

            </div>


            <div className="dashboard-kpi-card">

              <div className="kpi-top">

                <div className="kpi-icon cyan">
                  <Users size={19} />
                </div>

                <span className="kpi-label">
                  CUSTOMERS
                </span>

              </div>

              <div className="kpi-value">
                {loading
                  ? '—'
                  : formatNumber(
                      kpis.customers
                    )}
              </div>

              <div className="kpi-footer">

                <span className="kpi-positive">
                  <Users size={13} />
                  Unique customers
                </span>

                <span className="kpi-period">
                  Current
                </span>

              </div>

            </div>

          </div>


          {/* =================================================
              EXECUTIVE SUMMARY
              ================================================= */}

          <section className="executive-section">

            <div className="section-heading">

              <div>
                <span className="section-eyebrow">
                  EXECUTIVE VIEW
                </span>

                <h2>
                  Business Summary
                </h2>

                <p>
                  A quick view of what is happening
                  across your business.
                </p>
              </div>

              <div className="live-badge">
                <Zap size={14} />
                Live Data
              </div>

            </div>


            <div className="executive-grid">

              <div className="executive-card">

                <div className="executive-icon blue">
                  <TrendingUp size={20} />
                </div>

                <div>
                  <span>
                    Revenue Trend
                  </span>

                  <strong>
                    {revenueChange >= 0
                      ? `+${revenueChange.toFixed(1)}%`
                      : `${revenueChange.toFixed(1)}%`}
                  </strong>

                  <small>
                    Compared with previous period
                  </small>
                </div>

              </div>


              <div className="executive-card">

                <div className="executive-icon green">
                  <Target size={20} />
                </div>

                <div>
                  <span>
                    Profit Margin
                  </span>

                  <strong>
                    {kpis.revenue
                      ? `${(
                          (kpis.profit /
                            kpis.revenue) *
                          100
                        ).toFixed(1)}%`
                      : '0.0%'}
                  </strong>

                  <small>
                    Current business margin
                  </small>
                </div>

              </div>


              <div className="executive-card">

                <div className="executive-icon purple">
                  <BarChart3 size={20} />
                </div>

                <div>
                  <span>
                    Best Region
                  </span>

                  <strong>
                    {bestRegion?.name ||
                      'No data'}
                  </strong>

                  <small>
                    Highest regional revenue
                  </small>
                </div>

              </div>


              <div className="executive-card">

                <div className="executive-icon orange">
                  <Package size={20} />
                </div>

                <div>
                  <span>
                    Top Product
                  </span>

                  <strong className="truncate">
                    {bestProduct?.name ||
                      'No data'}
                  </strong>

                  <small>
                    Highest current revenue
                  </small>
                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              CHARTS
              ================================================= */}

          <div className="dashboard-chart-grid">

            <section className="dashboard-panel revenue-panel">

              <div className="panel-header">

                <div>
                  <span className="panel-eyebrow">
                    PERFORMANCE
                  </span>

                  <h2>
                    Revenue Trend
                  </h2>

                  <p>
                    Monthly revenue movement
                  </p>
                </div>

                <div className="panel-icon">
                  <TrendingUp size={18} />
                </div>

              </div>


              <div className="chart-container">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart
                    data={trendData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 0,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={
                        dark
                          ? '#263247'
                          : '#e8edf5'
                      }
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 11,
                        fill: dark
                          ? '#98a2b3'
                          : '#667085',
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 10,
                        fill: dark
                          ? '#98a2b3'
                          : '#667085',
                      }}
                      tickFormatter={(value) =>
                        `$${Math.round(
                          value / 1000
                        )}k`
                      }
                    />

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3155ff"
                      strokeWidth={3}
                      dot={{
                        r: 3,
                        fill: '#3155ff',
                      }}
                      activeDot={{
                        r: 6,
                      }}
                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>

            </section>


            <section className="dashboard-panel">

              <div className="panel-header">

                <div>
                  <span className="panel-eyebrow">
                    GEOGRAPHY
                  </span>

                  <h2>
                    Revenue by Region
                  </h2>

                  <p>
                    Regional performance
                  </p>
                </div>

                <div className="panel-icon">
                  <BarChart3 size={18} />
                </div>

              </div>


              <div className="chart-container">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={regionData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 10,
                      left: 5,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke={
                        dark
                          ? '#263247'
                          : '#e8edf5'
                      }
                    />

                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 10,
                        fill: dark
                          ? '#98a2b3'
                          : '#667085',
                      }}
                      tickFormatter={(value) =>
                        `$${Math.round(
                          value / 1000
                        )}k`
                      }
                    />

                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      width={65}
                      tick={{
                        fontSize: 11,
                        fill: dark
                          ? '#d0d5dd'
                          : '#344054',
                      }}
                    />

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                    <Bar
                      dataKey="value"
                      fill="#3155ff"
                      radius={[
                        0,
                        7,
                        7,
                        0,
                      ]}
                      barSize={20}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </section>

          </div>


          {/* =================================================
              FORECASTING
              ================================================= */}

          <section className="feature-section forecast-section">

            <div className="section-heading">

              <div>
                <span className="section-eyebrow">
                  🔮 FORECASTING
                </span>

                <h2>
                  Business Forecast
                </h2>

                <p>
                  Estimate future revenue using your
                  historical dashboard trend.
                </p>
              </div>


              <div className="forecast-controls">

                <span>
                  Forecast:
                </span>

                <button
                  type="button"
                  className={
                    forecastMonths === 3
                      ? 'forecast-option active'
                      : 'forecast-option'
                  }
                  onClick={() =>
                    setForecastMonths(3)
                  }
                >
                  3M
                </button>

                <button
                  type="button"
                  className={
                    forecastMonths === 6
                      ? 'forecast-option active'
                      : 'forecast-option'
                  }
                  onClick={() =>
                    setForecastMonths(6)
                  }
                >
                  6M
                </button>

                <button
                  type="button"
                  className={
                    forecastMonths === 12
                      ? 'forecast-option active'
                      : 'forecast-option'
                  }
                  onClick={() =>
                    setForecastMonths(12)
                  }
                >
                  12M
                </button>

              </div>

            </div>


            <div className="forecast-grid">

              <div className="forecast-chart-card">

                <div className="forecast-chart">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <LineChart
                      data={forecastData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 0,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={
                          dark
                            ? '#263247'
                            : '#e8edf5'
                        }
                      />

                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 10,
                          fill: dark
                            ? '#98a2b3'
                            : '#667085',
                        }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 10,
                          fill: dark
                            ? '#98a2b3'
                            : '#667085',
                        }}
                        tickFormatter={(value) =>
                          `$${Math.round(
                            value / 1000
                          )}k`
                        }
                      />

                      <Tooltip
                        formatter={(value) =>
                          value === null
                            ? '-'
                            : formatCurrency(
                                value
                              )
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#3155ff"
                        strokeWidth={3}
                        dot={false}
                      />

                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#7c3aed"
                        strokeWidth={3}
                        strokeDasharray="7 6"
                        dot={{
                          r: 3,
                        }}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

                <div className="forecast-legend">

                  <span>
                    <i className="legend-line actual" />
                    Actual Revenue
                  </span>

                  <span>
                    <i className="legend-line forecast" />
                    Forecast Revenue
                  </span>

                </div>

              </div>


              <div className="forecast-stat-grid">

                <div className="forecast-stat">

                  <span>
                    Projected Revenue
                  </span>

                  <strong>
                    {formatCurrency(
                      projectedRevenue
                    )}
                  </strong>

                  <small>
                    Next {forecastMonths} months
                  </small>

                </div>


                <div className="forecast-stat">

                  <span>
                    Forecast Accuracy
                  </span>

                  <strong>
                    {forecastAccuracy}%
                  </strong>

                  <div className="mini-progress">
                    <span
                      style={{
                        width: `${forecastAccuracy}%`,
                      }}
                    />
                  </div>

                </div>


                <div className="forecast-stat">

                  <span>
                    Average Revenue
                  </span>

                  <strong>
                    {formatCurrency(
                      averageRevenue
                    )}
                  </strong>

                  <small>
                    Historical average
                  </small>

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              GOALS
              ================================================= */}

          <section className="feature-section">

            <div className="section-heading">

              <div>
                <span className="section-eyebrow">
                  🎯 GOALS
                </span>

                <h2>
                  Business Goals
                </h2>

                <p>
                  Track progress toward your revenue
                  and profit targets.
                </p>
              </div>

            </div>


            <div className="goals-grid">

              <div className="goal-card revenue-goal">

                <div className="goal-header">

                  <div className="goal-title">

                    <div className="goal-icon">
                      <TrendingUp size={20} />
                    </div>

                    <div>
                      <strong>
                        Revenue Goal
                      </strong>

                      <span>
                        Target performance
                      </span>
                    </div>

                  </div>

                  <Target size={20} />

                </div>


                <div className="goal-values">

                  <strong>
                    {formatCurrency(
                      kpis.revenue
                    )}
                  </strong>

                  <span>
                    / {formatCurrency(
                      revenueGoal
                    )}
                  </span>

                </div>


                <div className="goal-progress">

                  <span
                    style={{
                      width: `${revenueGoalProgress}%`,
                    }}
                  />

                </div>


                <div className="goal-footer">

                  <strong>
                    {revenueGoalProgress.toFixed(
                      0
                    )}%
                  </strong>

                  <span>
                    {kpis.revenue >=
                    revenueGoal
                      ? 'Goal achieved'
                      : `${formatCurrency(
                          Math.max(
                            0,
                            revenueGoal -
                              kpis.revenue
                          )
                        )} remaining`}
                  </span>

                </div>


                <div className="goal-input">

                  <label>
                    Set Revenue Goal
                  </label>

                  <input
                    type="number"
                    value={revenueGoal}
                    onChange={(event) =>
                      setRevenueGoal(
                        Number(
                          event.target.value
                        )
                      )
                    }
                  />

                </div>

              </div>


              <div className="goal-card profit-goal">

                <div className="goal-header">

                  <div className="goal-title">

                    <div className="goal-icon green">
                      <Activity size={20} />
                    </div>

                    <div>
                      <strong>
                        Profit Goal
                      </strong>

                      <span>
                        Target profitability
                      </span>
                    </div>

                  </div>

                  <Target size={20} />

                </div>


                <div className="goal-values">

                  <strong>
                    {formatCurrency(
                      kpis.profit
                    )}
                  </strong>

                  <span>
                    / {formatCurrency(
                      profitGoal
                    )}
                  </span>

                </div>


                <div className="goal-progress green-progress">

                  <span
                    style={{
                      width: `${profitGoalProgress}%`,
                    }}
                  />

                </div>


                <div className="goal-footer">

                  <strong>
                    {profitGoalProgress.toFixed(
                      0
                    )}%
                  </strong>

                  <span>
                    {kpis.profit >=
                    profitGoal
                      ? 'Goal achieved'
                      : `${formatCurrency(
                          Math.max(
                            0,
                            profitGoal -
                              kpis.profit
                          )
                        )} remaining`}
                  </span>

                </div>


                <div className="goal-input">

                  <label>
                    Set Profit Goal
                  </label>

                  <input
                    type="number"
                    value={profitGoal}
                    onChange={(event) =>
                      setProfitGoal(
                        Number(
                          event.target.value
                        )
                      )
                    }
                  />

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              INSIGHTS & ALERTS
              ================================================= */}

          <section className="feature-section">

            <div className="section-heading">

              <div>
                <span className="section-eyebrow">
                  🔔 INSIGHTS & ALERTS
                </span>

                <h2>
                  Business Intelligence Center
                </h2>

                <p>
                  Important signals generated from
                  your current dashboard data.
                </p>
              </div>

            </div>


            <div className="insights-alerts-grid">

              {/* AI INSIGHTS */}

              <div className="insight-card">

                <div className="insight-card-header">

                  <div className="insight-title">

                    <div className="insight-icon ai">
                      <Sparkles size={18} />
                    </div>

                    <div>
                      <strong>
                        AI Insights
                      </strong>

                      <span>
                        Automated observations
                      </span>
                    </div>

                  </div>

                </div>


                <div className="insight-list">

                  {aiInsights.map(
                    (insight, index) => (
                      <div
                        className="insight-row"
                        key={index}
                      >

                        <CheckCircle2 size={16} />

                        <span>
                          {insight}
                        </span>

                      </div>
                    )
                  )}

                </div>

              </div>


              {/* ALERTS */}

              <div className="alert-card">

                <div className="insight-card-header">

                  <div className="insight-title">

                    <div className="insight-icon alert">
                      <Bell size={18} />
                    </div>

                    <div>
                      <strong>
                        Performance Alerts
                      </strong>

                      <span>
                        Current business signals
                      </span>
                    </div>

                  </div>

                </div>


                <div className="alert-list">

                  {alerts.map(
                    (alert, index) => (

                      <div
                        className={`alert-row ${alert.type}`}
                        key={index}
                      >

                        <div className="alert-row-icon">

                          {alert.type ===
                          'success' ? (
                            <CheckCircle2
                              size={16}
                            />
                          ) : (
                            <AlertCircle
                              size={16}
                            />
                          )}

                        </div>

                        <div>

                          <strong>
                            {alert.title}
                          </strong>

                          <span>
                            {alert.text}
                          </span>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              CATEGORY + PRODUCTS
              ================================================= */}

          <div className="dashboard-chart-grid">

            <section className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <span className="panel-eyebrow">
                    PRODUCT MIX
                  </span>

                  <h2>
                    Revenue by Category
                  </h2>

                  <p>
                    Category contribution
                  </p>

                </div>

                <div className="panel-icon purple">
                  <BarChart3 size={18} />
                </div>

              </div>


              <div className="category-chart-wrapper">

                <div className="category-donut">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <RechartsPieChart>

                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                      >

                        {categoryData.map(
                          (entry, index) => (
                            <Cell
                              key={`category-${index}`}
                              fill={
                                pieColors[
                                  index %
                                    pieColors.length
                                ]
                              }
                            />
                          )
                        )}

                      </Pie>

                      <Tooltip />

                    </RechartsPieChart>

                  </ResponsiveContainer>


                  <div className="donut-center">

                    <strong>
                      {categoryData.length}
                    </strong>

                    <span>
                      Categories
                    </span>

                  </div>

                </div>


                <div className="category-legend">

                  {categoryData.map(
                    (item, index) => {

                      const percentage =
                        categoryTotal > 0
                          ? (
                              (Number(
                                item.value
                              ) /
                                categoryTotal) *
                              100
                            ).toFixed(0)
                          : 0

                      return (
                        <div
                          className="legend-item"
                          key={`${item.name}-${index}`}
                        >

                          <div className="legend-left">

                            <span
                              className="legend-dot"
                              style={{
                                background:
                                  pieColors[
                                    index %
                                      pieColors.length
                                  ],
                              }}
                            />

                            <span>
                              {item.name}
                            </span>

                          </div>

                          <strong>
                            {percentage}%
                          </strong>

                        </div>
                      )
                    }
                  )}

                </div>

              </div>

            </section>


            <section className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <span className="panel-eyebrow">
                    TOP PERFORMERS
                  </span>

                  <h2>
                    Top Products
                  </h2>

                  <p>
                    Highest revenue products
                  </p>

                </div>

                <div className="panel-icon orange">
                  <Package size={18} />
                </div>

              </div>


              <div className="product-list">

                {productData.map(
                  (product, index) => (

                    <div
                      className="product-row"
                      key={`${product.name}-${index}`}
                    >

                      <div className="product-rank">
                        {index + 1}
                      </div>

                      <div className="product-info">

                        <div className="product-name">
                          {product.name}
                        </div>

                        <div className="product-progress">

                          <span
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  8,
                                  (product.value /
                                    Math.max(
                                      productData[0]
                                        ?.value || 1,
                                      1
                                    )) *
                                    100
                                )
                              )}%`,
                            }}
                          />

                        </div>

                      </div>

                      <strong className="product-value">
                        {formatCurrency(
                          product.value
                        )}
                      </strong>

                    </div>
                  )
                )}

              </div>

            </section>

          </div>


          {/* =================================================
              DATASET ACTIVITY
              ================================================= */}

          <section className="dataset-activity-section">

            <div className="dataset-activity-main">

              <div className="dataset-activity-icon">
                <Database size={22} />
              </div>

              <div>

                <span className="section-eyebrow">
                  DATASET ACTIVITY
                </span>

                <h2>
                  Your dashboard is connected
                </h2>

                <p>
                  Dashboard metrics, charts and
                  intelligence are being generated from
                  the active business dataset.
                </p>

              </div>

            </div>


            <div className="dataset-activity-stats">

              <div>
                <span>
                  Records
                </span>

                <strong>
                  {formatNumber(
                    kpis.orders
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Customers
                </span>

                <strong>
                  {formatNumber(
                    kpis.customers
                  )}
                </strong>
              </div>

              <Link
                to="/dataset"
                className="dataset-view-button"
              >
                <Database size={16} />
                View Dataset
              </Link>

            </div>

          </section>


          {/* =================================================
              AI COPILOT
              ================================================= */}

          <section className="dashboard-copilot">

            <div className="copilot-icon">
              <Sparkles size={24} />
            </div>


            <div className="copilot-content">

              <span className="copilot-eyebrow">
                AI ANALYTICS COPILOT
              </span>

              <h2>
                Ask MetricMind anything
              </h2>

              <p>
                Turn your business data into instant
                insights using natural language.
              </p>


              <form
                className="copilot-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  askCopilot()
                }}
              >

                <input
                  value={copilotQuestion}
                  onChange={(event) =>
                    setCopilotQuestion(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Show me the highest revenue region"
                />

                <button
                  type="submit"
                  disabled={
                    copilotLoading ||
                    !copilotQuestion.trim()
                  }
                >

                  {copilotLoading ? (
                    <RefreshCw
                      size={16}
                      className="spin"
                    />
                  ) : (
                    <Sparkles size={16} />
                  )}

                  Ask AI

                </button>

              </form>


              {copilotAnswer && (
                <div className="copilot-answer">

                  <div className="answer-label">
                    MetricMind
                  </div>

                  <div className="answer-text">
                    {copilotAnswer}
                  </div>

                </div>
              )}

            </div>

          </section>


          {/* =================================================
              QUICK ACTIONS
              ================================================= */}

          <section className="quick-actions-section">

            <div className="quick-actions-heading">

              <div>

                <span className="section-eyebrow">
                  WORKSPACE
                </span>

                <h2>
                  Quick Actions
                </h2>

              </div>

            </div>


            <div className="quick-actions-grid">

              <Link
                to="/add-data"
                className="quick-action-card"
              >

                <div className="quick-action-icon blue">
                  <Plus size={19} />
                </div>

                <div>
                  <strong>
                    Add Business Data
                  </strong>

                  <span>
                    Enter new business records
                  </span>
                </div>

                <ChevronRight size={17} />

              </Link>


              <Link
                to="/dataset"
                className="quick-action-card"
              >

                <div className="quick-action-icon purple">
                  <Upload size={19} />
                </div>

                <div>
                  <strong>
                    Dataset
                  </strong>

                  <span>
                    Manage your business dataset
                  </span>
                </div>

                <ChevronRight size={17} />

              </Link>


              <Link
                to="/ai-query"
                className="quick-action-card"
              >

                <div className="quick-action-icon cyan">
                  <Sparkles size={19} />
                </div>

                <div>
                  <strong>
                    AI Analysis
                  </strong>

                  <span>
                    Ask questions about your data
                  </span>
                </div>

                <ChevronRight size={17} />

              </Link>


              <Link
                to="/reports"
                className="quick-action-card"
              >

                <div className="quick-action-icon green">
                  <FileBarChart size={19} />
                </div>

                <div>
                  <strong>
                    Generate Report
                  </strong>

                  <span>
                    Create business reports
                  </span>
                </div>

                <ChevronRight size={17} />

              </Link>

            </div>

          </section>


          {/* FOOTER */}

          <footer className="dashboard-footer">

            <div>

              <strong>
                MetricMind
              </strong>

              <span>
                AI-powered business intelligence
              </span>

            </div>


            <div className="footer-status">

              <span
                className={
                  apiOnline
                    ? 'status-dot online'
                    : 'status-dot offline'
                }
              />

              {apiOnline
                ? 'All systems operational'
                : 'Backend unavailable'}

            </div>

          </footer>

        </section>

      </main>

    </div>
  )
}