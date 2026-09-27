import { useEffect, useMemo, useState } from 'react'

import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BrainCircuit,
  ChevronRight,
  Database,
  FileBarChart,
  Gauge,
  Home,
  Lightbulb,
  Moon,
  Package,
  PieChart,
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
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

  const [notificationOpen, setNotificationOpen] =
    useState(false)

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

  const [copilotQuestion, setCopilotQuestion] =
    useState('')

  const [copilotAnswer, setCopilotAnswer] =
    useState(
      'Ask MetricMind about your revenue, profit, customers, products or regions.'
    )

  const [copilotLoading, setCopilotLoading] =
    useState(false)


  /* =========================================================
     ACTIVE SIDEBAR
     ========================================================= */

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }

    return location.pathname.startsWith(path)
  }


  /* =========================================================
     LOAD DASHBOARD
     ========================================================= */

  const loadDashboard = async () => {
    setLoading(true)

    try {
      const healthResponse =
        await apiService.health()

      setApiOnline(
        healthResponse?.status >= 200 &&
        healthResponse?.status < 300
      )
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
        const data =
          kpiResponse.value?.data || {}

        setKpis({
          revenue:
            Number(data.revenue || 0),

          profit:
            Number(data.profit || 0),

          orders:
            Number(data.orders || 0),

          customers:
            Number(data.customers || 0),
        })
      }


      if (regionResponse.status === 'fulfilled') {
        setRegionData(
          normalizeRegion(
            extractRows(
              regionResponse.value
            )
          )
        )
      }


      if (categoryResponse.status === 'fulfilled') {
        setCategoryData(
          normalizeCategory(
            extractRows(
              categoryResponse.value
            )
          )
        )
      }


      if (trendResponse.status === 'fulfilled') {
        setTrendData(
          normalizeTrend(
            extractRows(
              trendResponse.value
            )
          )
        )
      }


      if (productResponse.status === 'fulfilled') {
        setProductData(
          normalizeProducts(
            extractRows(
              productResponse.value
            )
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


  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {
    loadDashboard()
  }, [])


  /* =========================================================
     SEARCH
     ========================================================= */

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


  /* =========================================================
     AI COPILOT
     ========================================================= */

  const askCopilot = async () => {
    const question =
      copilotQuestion.trim()

    if (!question) {
      return
    }

    setCopilotLoading(true)

    setCopilotAnswer(
      'Analyzing your business data...'
    )

    try {
      const response =
        await apiService.query({
          question,
        })

      setCopilotAnswer(
        response?.data?.answer ||
        response?.data?.message ||
        'I found the requested information.'
      )
    } catch (error) {
      console.error(
        'Copilot error:',
        error
      )

      setCopilotAnswer(
        'Unable to connect to the analytics engine. Please check the backend.'
      )
    } finally {
      setCopilotLoading(false)
    }
  }


  /* =========================================================
     CALCULATIONS
     ========================================================= */

  const categoryTotal = useMemo(() => {
    return categoryData.reduce(
      (total, item) =>
        total + Number(item.value || 0),
      0
    )
  }, [categoryData])


  const averageOrderValue =
    kpis.orders > 0
      ? kpis.revenue / kpis.orders
      : 0


  const profitMargin =
    kpis.revenue > 0
      ? (kpis.profit / kpis.revenue) * 100
      : 0


  const lastRevenue =
    trendData.length
      ? Number(
          trendData[
            trendData.length - 1
          ]?.revenue || 0
        )
      : 0


  const previousRevenue =
    trendData.length > 1
      ? Number(
          trendData[
            trendData.length - 2
          ]?.revenue || 0
        )
      : 0


  const revenueGrowth =
    previousRevenue > 0
      ? ((lastRevenue - previousRevenue) /
          previousRevenue) *
        100
      : 0


  /* =========================================================
     FORECAST
     ========================================================= */

  const revenueForecast =
    lastRevenue > 0
      ? lastRevenue * 1.12
      : kpis.revenue * 1.1


  const salesForecast =
    kpis.orders > 0
      ? Math.round(kpis.orders * 1.08)
      : 0


  const forecastAccuracy =
    trendData.length >= 3
      ? 91
      : 87


  /* =========================================================
     GOALS
     ========================================================= */

  const revenueGoal =
    Math.max(
      2500000,
      Math.ceil(
        Math.max(kpis.revenue, 1) /
          500000
      ) * 500000
    )


  const profitGoal =
    Math.max(
      350000,
      Math.ceil(
        Math.max(kpis.profit, 1) /
          50000
      ) * 50000
    )


  const revenueGoalProgress =
    Math.min(
      100,
      revenueGoal > 0
        ? (kpis.revenue / revenueGoal) *
            100
        : 0
    )


  const profitGoalProgress =
    Math.min(
      100,
      profitGoal > 0
        ? (kpis.profit / profitGoal) *
            100
        : 0
    )


  /* =========================================================
     ALERTS
     ========================================================= */

  const alerts = [
    {
      icon: Lightbulb,
      type: 'AI Insight',
      title:
        revenueGrowth >= 0
          ? 'Revenue momentum is positive'
          : 'Revenue needs attention',
      text:
        revenueGrowth >= 0
          ? `Revenue changed ${revenueGrowth.toFixed(
              1
            )}% in the latest period.`
          : `Revenue decreased ${Math.abs(
              revenueGrowth
            ).toFixed(1)}% in the latest period.`,
      className:
        revenueGrowth >= 0
          ? 'success'
          : 'warning',
    },

    {
      icon: TrendingUp,
      type: 'Revenue Alert',
      title:
        kpis.revenue > 0
          ? 'Revenue data is available'
          : 'Revenue data required',
      text:
        kpis.revenue > 0
          ? `Current revenue is ${formatCurrency(
              kpis.revenue
            )}.`
          : 'Upload business data to generate revenue insights.',
      className:
        kpis.revenue > 0
          ? 'info'
          : 'warning',
    },

    {
      icon: Activity,
      type: 'Profit Alert',
      title:
        profitMargin >= 10
          ? 'Healthy profit margin'
          : 'Review profit margin',
      text:
        `Current margin is ${profitMargin.toFixed(
          1
        )}%.`,
      className:
        profitMargin >= 10
          ? 'success'
          : 'warning',
    },

    {
      icon: Gauge,
      type: 'Performance Alert',
      title:
        kpis.orders > 0
          ? 'Order activity detected'
          : 'Waiting for order data',
      text:
        `${formatNumber(
          kpis.orders
        )} orders are currently tracked.`,
      className:
        kpis.orders > 0
          ? 'info'
          : 'warning',
    },
  ]


  /* =========================================================
     PIE COLORS
     ========================================================= */

  const pieColors = [
    '#3155ff',
    '#7c3aed',
    '#06b6d4',
    '#10b981',
    '#f59e0b',
  ]


  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div
      className={
        dark
          ? 'mm-dashboard mm-dark'
          : 'mm-dashboard mm-light'
      }
    >


      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside className="mm-sidebar">

        <div className="mm-brand">

          <div className="mm-brand-logo">
            M
          </div>

          <div>
            <strong>
              MetricMind
            </strong>

            <span>
              BUSINESS INTELLIGENCE
            </span>
          </div>

        </div>


        <div className="mm-nav-label">
          MAIN
        </div>


        <nav className="mm-nav">

          <Link
            to="/"
            className={
              isActive('/')
                ? 'mm-nav-item active'
                : 'mm-nav-item'
            }
          >
            <Home size={18} />
            Dashboard
          </Link>


          <Link
            to="/analytics"
            className={
              isActive('/analytics')
                ? 'mm-nav-item active'
                : 'mm-nav-item'
            }
          >
            <BarChart3 size={18} />
            Analytics
          </Link>


          <Link
            to="/dataset"
            className={
              isActive('/dataset')
                ? 'mm-nav-item active'
                : 'mm-nav-item'
            }
          >
            <Database size={18} />
            Dataset
          </Link>


          <Link
            to="/add-data"
            className={
              isActive('/add-data')
                ? 'mm-nav-item active'
                : 'mm-nav-item'
            }
          >
            <Plus size={18} />
            Add Data
          </Link>


          <Link
            to="/ai-query"
            className={
              isActive('/ai-query')
                ? 'mm-nav-item active'
                : 'mm-nav-item'
            }
          >
            <Sparkles size={18} />
            AI Query
          </Link>

        </nav>


        <div className="mm-nav-label">
          MANAGEMENT
        </div>


        <nav className="mm-nav">

          <Link
            to="/reports"
            className={
              isActive('/reports')
                ? 'mm-nav-item active'
                : 'mm-nav-item'
            }
          >
            <FileBarChart size={18} />
            Reports
          </Link>


          <Link
            to="/settings"
            className={
              isActive('/settings')
                ? 'mm-nav-item active'
                : 'mm-nav-item'
            }
          >
            <Settings size={18} />
            Settings
          </Link>

        </nav>


        <div className="mm-sidebar-bottom">

          <div className="mm-system-card">

            <div className="mm-system-icon">
              <Activity size={17} />
            </div>

            <div>

              <strong>
                System Status
              </strong>

              <span>
                <i
                  className={
                    apiOnline
                      ? 'online'
                      : 'offline'
                  }
                />

                {apiOnline
                  ? 'API Connected'
                  : 'API Offline'}
              </span>

            </div>

          </div>

        </div>

      </aside>


      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="mm-main">


        {/* ===================================================
            TOPBAR
            =================================================== */}

        <header className="mm-topbar">

          <form
            className="mm-search"
            onSubmit={handleSearch}
          >

            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search your business data..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch('')
                }
              >
                <X size={15} />
              </button>
            )}

          </form>


          <div className="mm-top-actions">

            <button
              className="mm-icon-btn"
              type="button"
              onClick={toggleDarkMode}
              title="Toggle theme"
            >
              {dark ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>


            <div className="mm-notification">

              <button
                className="mm-icon-btn"
                type="button"
                onClick={() =>
                  setNotificationOpen(
                    !notificationOpen
                  )
                }
              >
                <Bell size={18} />

                <span className="mm-notification-dot" />
              </button>


              {notificationOpen && (
                <div className="mm-notification-panel">

                  <div className="mm-notification-header">
                    <strong>
                      Notifications
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        setNotificationOpen(false)
                      }
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="mm-notification-content">

                    <Bell size={18} />

                    <div>
                      <strong>
                        Dashboard updated
                      </strong>

                      <span>
                        Your latest business data is available.
                      </span>
                    </div>

                  </div>

                </div>
              )}

            </div>


            <div className="mm-profile">

              <div className="mm-avatar">
                M
              </div>

              <div>
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


        {/* ===================================================
            CONTENT
            =================================================== */}

        <div className="mm-content">


          {/* HERO */}

          <section className="mm-hero">

            <div>

              <div className="mm-overline">
                <span />
                BUSINESS INTELLIGENCE
              </div>

              <h1>
                Business Command Center
              </h1>

              <p>
                Monitor performance, discover insights,
                forecast growth and manage business goals.
              </p>

            </div>


            <div className="mm-hero-actions">

              <div
                className={
                  apiOnline
                    ? 'mm-live-badge connected'
                    : 'mm-live-badge'
                }
              >
                <span />
                {apiOnline
                  ? 'Live Data'
                  : 'Preview Mode'}
              </div>


              <button
                className="mm-secondary-btn"
                type="button"
                onClick={loadDashboard}
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={
                    loading
                      ? 'mm-spin'
                      : ''
                  }
                />

                Refresh
              </button>


              <Link
                to="/add-data"
                className="mm-primary-btn"
              >
                <Plus size={17} />
                Add Data
              </Link>

            </div>

          </section>


          {/* KPI */}

          <section className="mm-kpi-grid">

            <div className="mm-kpi-card revenue">

              <div className="mm-kpi-icon">
                <TrendingUp size={21} />
              </div>

              <div className="mm-kpi-label">
                TOTAL REVENUE
              </div>

              <strong>
                {loading
                  ? '—'
                  : formatCurrency(
                      kpis.revenue
                    )}
              </strong>

              <span className="mm-kpi-meta">
                <ArrowUpRight size={14} />
                Business revenue
              </span>

            </div>


            <div className="mm-kpi-card profit">

              <div className="mm-kpi-icon">
                <Activity size={21} />
              </div>

              <div className="mm-kpi-label">
                TOTAL PROFIT
              </div>

              <strong>
                {loading
                  ? '—'
                  : formatCurrency(
                      kpis.profit
                    )}
              </strong>

              <span className="mm-kpi-meta">
                <ArrowUpRight size={14} />
                {profitMargin.toFixed(1)}% margin
              </span>

            </div>


            <div className="mm-kpi-card orders">

              <div className="mm-kpi-icon">
                <ShoppingCart size={21} />
              </div>

              <div className="mm-kpi-label">
                TOTAL ORDERS
              </div>

              <strong>
                {loading
                  ? '—'
                  : formatNumber(
                      kpis.orders
                    )}
              </strong>

              <span className="mm-kpi-meta">
                <Package size={14} />
                Orders processed
              </span>

            </div>


            <div className="mm-kpi-card customers">

              <div className="mm-kpi-icon">
                <Users size={21} />
              </div>

              <div className="mm-kpi-label">
                CUSTOMERS
              </div>

              <strong>
                {loading
                  ? '—'
                  : formatNumber(
                      kpis.customers
                    )}
              </strong>

              <span className="mm-kpi-meta">
                <Users size={14} />
                Unique customers
              </span>

            </div>

          </section>


          {/* MINI METRICS */}

          <section className="mm-mini-grid">

            <div>
              <span>
                Average Order Value
              </span>

              <strong>
                {formatCurrency(
                  averageOrderValue
                )}
              </strong>
            </div>


            <div>
              <span>
                Profit Margin
              </span>

              <strong>
                {profitMargin.toFixed(1)}%
              </strong>
            </div>


            <div>
              <span>
                Revenue Growth
              </span>

              <strong
                className={
                  revenueGrowth >= 0
                    ? 'positive'
                    : 'negative'
                }
              >
                {revenueGrowth >= 0
                  ? '+'
                  : ''}
                {revenueGrowth.toFixed(1)}%
              </strong>
            </div>


            <div>
              <span>
                Forecast Accuracy
              </span>

              <strong>
                {forecastAccuracy}%
              </strong>
            </div>

          </section>


          {/* =================================================
              PERFORMANCE
              ================================================= */}

          <section className="mm-section">

            <div className="mm-section-heading">

              <div>
                <span>
                  PERFORMANCE
                </span>

                <h2>
                  Revenue & Sales Overview
                </h2>
              </div>

              <Link to="/analytics">
                View Analytics
                <ChevronRight size={15} />
              </Link>

            </div>


            <div className="mm-performance-grid">


              {/* TREND */}

              <div className="mm-panel mm-large-panel">

                <div className="mm-panel-header">

                  <div>
                    <strong>
                      Revenue Trend
                    </strong>

                    <span>
                      Monthly revenue performance
                    </span>
                  </div>

                  <div className="mm-panel-value">
                    {formatCurrency(
                      lastRevenue
                    )}
                    <small>
                      latest period
                    </small>
                  </div>

                </div>


                <div className="mm-chart">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <LineChart
                      data={trendData}
                      margin={{
                        top: 15,
                        right: 15,
                        left: 0,
                        bottom: 0,
                      }}
                    >

                      <CartesianGrid
                        vertical={false}
                        stroke={
                          dark
                            ? '#253047'
                            : '#edf0f5'
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
                        dot={false}
                        activeDot={{
                          r: 6,
                        }}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              </div>


              {/* REGION */}

              <div className="mm-panel">

                <div className="mm-panel-header">

                  <div>
                    <strong>
                      Revenue by Region
                    </strong>

                    <span>
                      Regional contribution
                    </span>
                  </div>

                  <BarChart3 size={19} />

                </div>


                <div className="mm-chart small">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={regionData}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 5,
                        left: 0,
                        bottom: 5,
                      }}
                    >

                      <CartesianGrid
                        horizontal={false}
                        stroke={
                          dark
                            ? '#253047'
                            : '#edf0f5'
                        }
                      />

                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 9,
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
                        width={60}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 10,
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
                          6,
                          6,
                          0,
                        ]}
                        barSize={18}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              INSIGHTS & ALERTS
              ================================================= */}

          <section className="mm-section">

            <div className="mm-section-heading">

              <div>
                <span>
                  INTELLIGENCE
                </span>

                <h2>
                  Insights & Alerts
                </h2>
              </div>

              <div className="mm-heading-badge">
                <Zap size={14} />
                AI Powered
              </div>

            </div>


            <div className="mm-alert-grid">

              {alerts.map(
                (alert, index) => {

                  const Icon =
                    alert.icon

                  return (
                    <div
                      className={`mm-alert-card ${alert.className}`}
                      key={index}
                    >

                      <div className="mm-alert-icon">
                        <Icon size={19} />
                      </div>

                      <div className="mm-alert-content">

                        <span>
                          {alert.type}
                        </span>

                        <strong>
                          {alert.title}
                        </strong>

                        <p>
                          {alert.text}
                        </p>

                      </div>

                      <ChevronRight
                        size={17}
                      />

                    </div>
                  )
                }
              )}

            </div>

          </section>


          {/* =================================================
              FORECASTING
              ================================================= */}

          <section className="mm-section">

            <div className="mm-section-heading">

              <div>
                <span>
                  PREDICTIVE ANALYTICS
                </span>

                <h2>
                  Forecasting
                </h2>
              </div>

              <div className="mm-heading-badge purple">
                <BrainCircuit size={14} />
                Predictive AI
              </div>

            </div>


            <div className="mm-forecast-grid">


              <div className="mm-forecast-card">

                <div className="mm-forecast-top">

                  <div className="mm-forecast-icon blue">
                    <TrendingUp size={20} />
                  </div>

                  <span>
                    REVENUE FORECAST
                  </span>

                </div>

                <strong>
                  {formatCurrency(
                    revenueForecast
                  )}
                </strong>

                <p>
                  Estimated next-period revenue
                </p>

                <div className="mm-forecast-growth">
                  <ArrowUpRight size={14} />
                  +12% projected
                </div>

              </div>


              <div className="mm-forecast-card">

                <div className="mm-forecast-top">

                  <div className="mm-forecast-icon purple">
                    <ShoppingCart size={20} />
                  </div>

                  <span>
                    SALES FORECAST
                  </span>

                </div>

                <strong>
                  {formatNumber(
                    salesForecast
                  )}
                </strong>

                <p>
                  Estimated next-period orders
                </p>

                <div className="mm-forecast-growth">
                  <ArrowUpRight size={14} />
                  +8% projected
                </div>

              </div>


              <div className="mm-forecast-card">

                <div className="mm-forecast-top">

                  <div className="mm-forecast-icon green">
                    <Gauge size={20} />
                  </div>

                  <span>
                    FORECAST ACCURACY
                  </span>

                </div>

                <strong>
                  {forecastAccuracy}%
                </strong>

                <p>
                  Historical forecast confidence
                </p>

                <div className="mm-progress">
                  <span
                    style={{
                      width: `${forecastAccuracy}%`,
                    }}
                  />
                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              GOALS
              ================================================= */}

          <section className="mm-section">

            <div className="mm-section-heading">

              <div>
                <span>
                  BUSINESS TARGETS
                </span>

                <h2>
                  Goals
                </h2>
              </div>

              <Target size={20} />

            </div>


            <div className="mm-goals-grid">


              <div className="mm-goal-card">

                <div className="mm-goal-header">

                  <div className="mm-goal-icon blue">
                    <TrendingUp size={18} />
                  </div>

                  <span>
                    REVENUE GOAL
                  </span>

                </div>

                <div className="mm-goal-numbers">

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

                <div className="mm-goal-progress">

                  <span
                    style={{
                      width: `${revenueGoalProgress}%`,
                    }}
                  />

                </div>

                <div className="mm-goal-footer">

                  <span>
                    Goal progress
                  </span>

                  <strong>
                    {revenueGoalProgress.toFixed(
                      0
                    )}%
                  </strong>

                </div>

              </div>


              <div className="mm-goal-card">

                <div className="mm-goal-header">

                  <div className="mm-goal-icon green">
                    <Activity size={18} />
                  </div>

                  <span>
                    PROFIT GOAL
                  </span>

                </div>

                <div className="mm-goal-numbers">

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

                <div className="mm-goal-progress green">

                  <span
                    style={{
                      width: `${profitGoalProgress}%`,
                    }}
                  />

                </div>

                <div className="mm-goal-footer">

                  <span>
                    Goal progress
                  </span>

                  <strong>
                    {profitGoalProgress.toFixed(
                      0
                    )}%
                  </strong>

                </div>

              </div>


              <div className="mm-goal-summary">

                <div className="mm-goal-summary-icon">
                  <Target size={22} />
                </div>

                <div>

                  <span>
                    OVERALL PERFORMANCE
                  </span>

                  <strong>
                    {Math.round(
                      (revenueGoalProgress +
                        profitGoalProgress) /
                        2
                    )}%
                  </strong>

                  <p>
                    Combined progress toward current business goals.
                  </p>

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              PRODUCT + CATEGORY
              ================================================= */}

          <section className="mm-two-column">


            {/* CATEGORY */}

            <div className="mm-panel">

              <div className="mm-panel-header">

                <div>
                  <strong>
                    Revenue by Category
                  </strong>

                  <span>
                    Product mix
                  </span>
                </div>

                <PieChart size={19} />

              </div>


              <div className="mm-category-area">

                <div className="mm-donut">

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
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={3}
                      >

                        {categoryData.map(
                          (entry, index) => (
                            <Cell
                              key={index}
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


                  <div className="mm-donut-center">

                    <strong>
                      {categoryData.length}
                    </strong>

                    <span>
                      Categories
                    </span>

                  </div>

                </div>


                <div className="mm-category-list">

                  {categoryData.map(
                    (item, index) => {

                      const percentage =
                        categoryTotal > 0
                          ? (
                              (item.value /
                                categoryTotal) *
                              100
                            ).toFixed(0)
                          : 0

                      return (
                        <div
                          className="mm-category-row"
                          key={`${item.name}-${index}`}
                        >

                          <span
                            className="mm-category-dot"
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

                          <strong>
                            {percentage}%
                          </strong>

                        </div>
                      )
                    }
                  )}

                </div>

              </div>

            </div>


            {/* PRODUCTS */}

            <div className="mm-panel">

              <div className="mm-panel-header">

                <div>
                  <strong>
                    Top Products
                  </strong>

                  <span>
                    Highest revenue products
                  </span>
                </div>

                <Package size={19} />

              </div>


              <div className="mm-products">

                {productData.map(
                  (product, index) => {

                    const max =
                      productData[0]
                        ?.value || 1

                    const width =
                      Math.min(
                        100,
                        Math.max(
                          8,
                          (product.value /
                            max) *
                            100
                        )
                      )

                    return (
                      <div
                        className="mm-product-row"
                        key={`${product.name}-${index}`}
                      >

                        <div className="mm-product-rank">
                          {index + 1}
                        </div>

                        <div className="mm-product-main">

                          <div className="mm-product-title">
                            {product.name}
                          </div>

                          <div className="mm-product-bar">
                            <span
                              style={{
                                width: `${width}%`,
                              }}
                            />
                          </div>

                        </div>

                        <strong>
                          {formatCurrency(
                            product.value
                          )}
                        </strong>

                      </div>
                    )
                  }
                )}

              </div>

            </div>

          </section>


          {/* =================================================
              AI COPILOT
              ================================================= */}

          <section className="mm-copilot">

            <div className="mm-copilot-icon">
              <Sparkles size={25} />
            </div>

            <div className="mm-copilot-content">

              <span>
                AI ANALYTICS COPILOT
              </span>

              <h2>
                Ask MetricMind anything
              </h2>

              <p>
                Ask questions about your business data
                using natural language.
              </p>


              <form
                className="mm-copilot-form"
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
                  placeholder="e.g. Which region generated the highest revenue?"
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
                      className="mm-spin"
                    />
                  ) : (
                    <Sparkles size={16} />
                  )}

                  Ask AI

                </button>

              </form>


              <div className="mm-copilot-answer">

                <strong>
                  MetricMind
                </strong>

                <span>
                  {copilotAnswer}
                </span>

              </div>

            </div>

          </section>


          {/* =================================================
              QUICK ACTIONS
              ================================================= */}

          <section className="mm-section">

            <div className="mm-section-heading">

              <div>
                <span>
                  WORKSPACE
                </span>

                <h2>
                  Quick Actions
                </h2>
              </div>

            </div>


            <div className="mm-actions-grid">

              <Link
                to="/dataset"
                className="mm-action-card"
              >

                <div className="blue">
                  <Database size={20} />
                </div>

                <section>
                  <strong>
                    Dataset
                  </strong>

                  <span>
                    View and manage your business data
                  </span>
                </section>

                <ChevronRight />

              </Link>


              <Link
                to="/add-data"
                className="mm-action-card"
              >

                <div className="green">
                  <Plus size={20} />
                </div>

                <section>
                  <strong>
                    Add Data
                  </strong>

                  <span>
                    Add a new business record
                  </span>
                </section>

                <ChevronRight />

              </Link>


              <Link
                to="/analytics"
                className="mm-action-card"
              >

                <div className="purple">
                  <BarChart3 size={20} />
                </div>

                <section>
                  <strong>
                    Analytics
                  </strong>

                  <span>
                    Explore detailed business analytics
                  </span>
                </section>

                <ChevronRight />

              </Link>


              <Link
                to="/ai-query"
                className="mm-action-card"
              >

                <div className="cyan">
                  <BrainCircuit size={20} />
                </div>

                <section>
                  <strong>
                    AI Query
                  </strong>

                  <span>
                    Ask AI questions about your dataset
                  </span>
                </section>

                <ChevronRight />

              </Link>

            </div>

          </section>


          {/* FOOTER */}

          <footer className="mm-footer">

            <div>
              <strong>
                MetricMind
              </strong>

              <span>
                AI-powered business intelligence
              </span>
            </div>

            <div>

              <span
                className={
                  apiOnline
                    ? 'mm-footer-dot online'
                    : 'mm-footer-dot offline'
                }
              />

              {apiOnline
                ? 'All systems operational'
                : 'Backend unavailable'}

            </div>

          </footer>

        </div>

      </main>

    </div>
  )
}