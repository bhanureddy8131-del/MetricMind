import { useEffect, useMemo, useState } from 'react'

import {
  Activity,
  BarChart3,
  Bell,
  ChevronRight,
  Database,
  FileBarChart,
  Home,
  Moon,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Sun,
  TrendingUp,
  Upload,
  Users,
  X,
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
      /* ---------------------------------------------------
         CHECK BACKEND HEALTH
         --------------------------------------------------- */

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
      /* ---------------------------------------------------
         LOAD DASHBOARD DATA
         --------------------------------------------------- */

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


      /* ===================================================
         KPI DATA
         =================================================== */

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
      } else {
        console.error(
          'KPI request failed:',
          kpiResponse.reason
        )
      }


      /* ===================================================
         REGION DATA
         =================================================== */

      if (regionResponse.status === 'fulfilled') {
        setRegionData(
          normalizeRegion(
            extractRows(
              regionResponse.value
            )
          )
        )
      } else {
        console.error(
          'Region request failed:',
          regionResponse.reason
        )
      }


      /* ===================================================
         CATEGORY DATA
         =================================================== */

      if (categoryResponse.status === 'fulfilled') {
        setCategoryData(
          normalizeCategory(
            extractRows(
              categoryResponse.value
            )
          )
        )
      } else {
        console.error(
          'Category request failed:',
          categoryResponse.reason
        )
      }


      /* ===================================================
         TREND DATA
         =================================================== */

      if (trendResponse.status === 'fulfilled') {
        setTrendData(
          normalizeTrend(
            extractRows(
              trendResponse.value
            )
          )
        )
      } else {
        console.error(
          'Trend request failed:',
          trendResponse.reason
        )
      }


      /* ===================================================
         PRODUCT DATA
         =================================================== */

      if (productResponse.status === 'fulfilled') {
        setProductData(
          normalizeProducts(
            extractRows(
              productResponse.value
            )
          )
        )
      } else {
        console.error(
          'Product request failed:',
          productResponse.reason
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
     CATEGORY TOTAL
     ======================================================= */

  const categoryTotal = useMemo(() => {
    return categoryData.reduce(
      (total, item) =>
        total + Number(item.value || 0),
      0
    )
  }, [categoryData])


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
          MAIN CONTENT
          =================================================== */}

      <main className="dashboard-main">


        {/* =================================================
            TOPBAR
            ================================================= */}

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


            {/* THEME */}

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


            {/* NOTIFICATION */}

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


                  <div className="notification-item">

                    <div className="notification-item-icon">
                      <Activity size={15} />
                    </div>

                    <div>

                      <strong>
                        MetricMind is running
                      </strong>

                      <p>
                        Your dashboard is ready.
                      </p>

                    </div>

                  </div>

                </div>
              )}

            </div>


            {/* PROFILE */}

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


        {/* =================================================
            PAGE CONTENT
            ================================================= */}

        <section className="dashboard-content">


          {/* PAGE HEADER */}

          <div className="dashboard-page-header">

            <div>

              <div className="dashboard-eyebrow">
                BUSINESS INTELLIGENCE
              </div>

              <h1>
                Dashboard
              </h1>

              <p>
                Monitor your business performance
                from one intelligent workspace.
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
              KPI CARDS
              ================================================= */}

          <div className="dashboard-kpi-grid">


            {/* REVENUE */}

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

                <span className="kpi-positive">

                  <TrendingUp size={13} />

                  Business performance

                </span>

                <span className="kpi-period">
                  Current
                </span>

              </div>

            </div>


            {/* PROFIT */}

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

                  <TrendingUp size={13} />

                  Profit generated

                </span>

                <span className="kpi-period">
                  Current
                </span>

              </div>

            </div>


            {/* ORDERS */}

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


            {/* CUSTOMERS */}

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
              CHART ROW
              ================================================= */}

          <div className="dashboard-chart-grid">


            {/* REVENUE TREND */}

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


            {/* REGION */}

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
              SECOND CHART ROW
              ================================================= */}

          <div className="dashboard-chart-grid">


            {/* CATEGORY */}

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
                  <PieChart size={18} />
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


            {/* TOP PRODUCTS */}

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
                  <ShoppingCart size={18} />
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
              AI COPILOT
              ================================================= */}

          <section className="dashboard-copilot">

            <div className="copilot-glow" />

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
                Turn your business data into
                instant insights using natural
                language.
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

                <span className="panel-eyebrow">
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
                    Upload Dataset
                  </strong>

                  <span>
                    Import CSV or Excel data
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
                    Ask questions about data
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


          {/* =================================================
              FOOTER
              ================================================= */}

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