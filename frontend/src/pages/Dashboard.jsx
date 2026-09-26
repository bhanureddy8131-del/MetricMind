import { useEffect, useMemo, useState } from 'react'

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Database,
  FileBarChart,
  Home,
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
  if (!rows.length) return fallbackRegion

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
  if (!rows.length) return fallbackCategory

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
  if (!rows.length) return fallbackTrend

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
  if (!rows.length) return fallbackProducts

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
  const [notificationOpen, setNotificationOpen] = useState(false)

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
      'Ask me anything about your business data.'
    )

  const [copilotLoading, setCopilotLoading] =
    useState(false)


  /* =======================================================
     SIDEBAR
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


  useEffect(() => {
    loadDashboard()
  }, [])


  /* =======================================================
     SEARCH
     ======================================================= */

  const handleSearch = (event) => {
    event.preventDefault()

    const value = search.trim()

    if (!value) return

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

    if (!cleanQuestion) return

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
        'Unable to connect to the analytics engine. Please check the backend.'
      )
    } finally {
      setCopilotLoading(false)
    }
  }


  /* =======================================================
     CALCULATIONS
     ======================================================= */

  const categoryTotal = useMemo(() => {
    return categoryData.reduce(
      (total, item) =>
        total + Number(item.value || 0),
      0
    )
  }, [categoryData])


  const averageOrderValue = useMemo(() => {
    if (!kpis.orders) return 0

    return kpis.revenue / kpis.orders
  }, [kpis])


  const profitMargin = useMemo(() => {
    if (!kpis.revenue) return 0

    return (
      (kpis.profit / kpis.revenue) *
      100
    )
  }, [kpis])


  const forecastRevenue = useMemo(() => {
    if (!trendData.length) {
      return kpis.revenue
    }

    const recent = trendData.slice(-3)

    const average =
      recent.reduce(
        (sum, item) =>
          sum + Number(item.revenue || 0),
        0
      ) / recent.length

    return average * 1.12
  }, [trendData, kpis.revenue])


  const revenueGoal =
    kpis.revenue > 0
      ? Math.ceil(kpis.revenue * 1.15)
      : 100000

  const profitGoal =
    kpis.profit > 0
      ? Math.ceil(kpis.profit * 1.2)
      : 30000

  const revenueGoalProgress =
    Math.min(
      100,
      Math.round(
        (kpis.revenue / revenueGoal) *
          100
      )
    )

  const profitGoalProgress =
    Math.min(
      100,
      Math.round(
        (kpis.profit / profitGoal) *
          100
      )
    )


  /* =======================================================
     COLORS
     ======================================================= */

  const pieColors = [
    '#3155ff',
    '#7048e8',
    '#00a8cc',
    '#12b886',
    '#f59f00',
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


        <div className="metric-sidebar-section">
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

          <div className="sidebar-status-card">

            <div className="sidebar-status-icon">
              <Activity size={16} />
            </div>

            <div>
              <span>System Status</span>

              <strong>
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
              </strong>
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
                onClick={() => setSearch('')}
              >
                <X size={15} />
              </button>
            )}

          </form>


          <div className="topbar-actions">

            <button
              type="button"
              className="topbar-icon"
              onClick={toggleDarkMode}
              title="Toggle theme"
            >
              {dark
                ? <Sun size={18} />
                : <Moon size={18} />}
            </button>


            <div className="notification-container">

              <button
                type="button"
                className="topbar-icon"
                onClick={() =>
                  setNotificationOpen(
                    (value) => !value
                  )
                }
              >
                <Bell size={18} />
                <span className="notification-badge" />
              </button>


              {notificationOpen && (
                <div className="notification-panel">

                  <div className="notification-panel-title">
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

                  <div className="notification-message">
                    <CheckCircle2 size={17} />

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


            <div className="profile-box">

              <div className="profile-avatar">
                B
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


        {/* CONTENT */}

        <div className="dashboard-content">


          {/* HERO */}

          <section className="dashboard-hero">

            <div>

              <span className="hero-label">
                BUSINESS INTELLIGENCE
              </span>

              <h1>
                Good day, welcome back.
              </h1>

              <p>
                Monitor performance, discover insights,
                and make data-driven decisions.
              </p>

            </div>


            <div className="hero-actions">

              <div
                className={
                  apiOnline
                    ? 'connection-pill connected'
                    : 'connection-pill'
                }
              >
                <span />
                {apiOnline
                  ? 'Live Data'
                  : 'Preview Mode'}
              </div>


              <button
                type="button"
                className="secondary-button"
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
                className="primary-button"
              >
                <Plus size={16} />
                Add Data
              </Link>

            </div>

          </section>


          {/* KPI */}

          <section className="kpi-grid">

            <div className="kpi-card revenue">

              <div className="kpi-card-top">
                <div className="kpi-icon">
                  <CircleDollarSign size={20} />
                </div>

                <span className="kpi-tag">
                  REVENUE
                </span>
              </div>

              <strong>
                {loading
                  ? '—'
                  : formatCurrency(kpis.revenue)}
              </strong>

              <div className="kpi-bottom">
                <span>
                  <ArrowUpRight size={14} />
                  Business revenue
                </span>

                <small>
                  Current
                </small>
              </div>

            </div>


            <div className="kpi-card profit">

              <div className="kpi-card-top">
                <div className="kpi-icon">
                  <TrendingUp size={20} />
                </div>

                <span className="kpi-tag">
                  PROFIT
                </span>
              </div>

              <strong>
                {loading
                  ? '—'
                  : formatCurrency(kpis.profit)}
              </strong>

              <div className="kpi-bottom">
                <span>
                  <ArrowUpRight size={14} />
                  {profitMargin.toFixed(1)}% margin
                </span>

                <small>
                  Current
                </small>
              </div>

            </div>


            <div className="kpi-card orders">

              <div className="kpi-card-top">
                <div className="kpi-icon">
                  <ShoppingCart size={20} />
                </div>

                <span className="kpi-tag">
                  ORDERS
                </span>
              </div>

              <strong>
                {loading
                  ? '—'
                  : formatNumber(kpis.orders)}
              </strong>

              <div className="kpi-bottom">
                <span>
                  <Package size={14} />
                  Orders processed
                </span>

                <small>
                  Current
                </small>
              </div>

            </div>


            <div className="kpi-card customers">

              <div className="kpi-card-top">
                <div className="kpi-icon">
                  <Users size={20} />
                </div>

                <span className="kpi-tag">
                  CUSTOMERS
                </span>
              </div>

              <strong>
                {loading
                  ? '—'
                  : formatNumber(kpis.customers)}
              </strong>

              <div className="kpi-bottom">
                <span>
                  <Users size={14} />
                  Unique customers
                </span>

                <small>
                  Current
                </small>
              </div>

            </div>

          </section>


          {/* PERFORMANCE */}

          <section className="section-heading">

            <div>
              <span>PERFORMANCE</span>
              <h2>Business overview</h2>
            </div>

            <Link to="/analytics">
              View analytics
              <ChevronRight size={15} />
            </Link>

          </section>


          <section className="two-column-grid">

            {/* REVENUE TREND */}

            <div className="dashboard-panel large-panel">

              <div className="panel-header">

                <div>
                  <span className="panel-label">
                    REVENUE
                  </span>

                  <h3>
                    Revenue Trend
                  </h3>

                  <p>
                    Monthly business performance
                  </p>
                </div>

                <div className="panel-symbol blue">
                  <TrendingUp size={18} />
                </div>

              </div>


              <div className="large-chart">

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
                          ? '#273247'
                          : '#e9edf4'
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

            </div>


            {/* REGION */}

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>
                  <span className="panel-label">
                    GEOGRAPHY
                  </span>

                  <h3>
                    Revenue by Region
                  </h3>

                  <p>
                    Regional contribution
                  </p>
                </div>

                <div className="panel-symbol purple">
                  <BarChart3 size={18} />
                </div>

              </div>


              <div className="medium-chart">

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
                          ? '#273247'
                          : '#e9edf4'
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
                      width={70}
                      axisLine={false}
                      tickLine={false}
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

          </section>


          {/* PRODUCT MIX */}

          <section className="two-column-grid">

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>
                  <span className="panel-label">
                    PRODUCT MIX
                  </span>

                  <h3>
                    Revenue by Category
                  </h3>

                  <p>
                    Category contribution
                  </p>
                </div>

                <div className="panel-symbol cyan">
                  <PieChart size={18} />
                </div>

              </div>


              <div className="category-layout">

                <div className="donut-chart">

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
                        innerRadius={62}
                        outerRadius={88}
                        paddingAngle={3}
                      >

                        {categoryData.map(
                          (entry, index) => (
                            <Cell
                              key={`${entry.name}-${index}`}
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


                  <div className="donut-label">
                    <strong>
                      {categoryData.length}
                    </strong>

                    <span>
                      Categories
                    </span>
                  </div>

                </div>


                <div className="category-list">

                  {categoryData.map(
                    (item, index) => {

                      const percentage =
                        categoryTotal
                          ? Math.round(
                              (item.value /
                                categoryTotal) *
                                100
                            )
                          : 0

                      return (
                        <div
                          className="category-row"
                          key={`${item.name}-${index}`}
                        >

                          <span
                            className="category-dot"
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


            {/* TOP PRODUCTS */}

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>
                  <span className="panel-label">
                    TOP PERFORMERS
                  </span>

                  <h3>
                    Top Products
                  </h3>

                  <p>
                    Highest revenue products
                  </p>
                </div>

                <div className="panel-symbol orange">
                  <Package size={18} />
                </div>

              </div>


              <div className="product-list">

                {productData.map(
                  (product, index) => {

                    const maximum =
                      productData[0]?.value || 1

                    const width =
                      Math.max(
                        8,
                        Math.min(
                          100,
                          (product.value /
                            maximum) *
                            100
                        )
                      )

                    return (
                      <div
                        className="product-row"
                        key={`${product.name}-${index}`}
                      >

                        <div className="product-number">
                          {index + 1}
                        </div>

                        <div className="product-main">

                          <div className="product-title">
                            {product.name}
                          </div>

                          <div className="product-bar">
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
              INSIGHTS & ALERTS
              ================================================= */}

          <section className="section-heading">

            <div>
              <span>INTELLIGENCE</span>
              <h2>Insights & Alerts</h2>
            </div>

            <Link to="/analytics">
              Explore insights
              <ChevronRight size={15} />
            </Link>

          </section>


          <section className="insights-grid">

            <div className="insight-card ai">

              <div className="insight-icon">
                <Sparkles size={20} />
              </div>

              <div className="insight-content">

                <span>AI INSIGHTS</span>

                <h3>
                  Business intelligence
                </h3>

                <p>
                  Your dashboard contains{' '}
                  <strong>
                    {formatNumber(kpis.orders)}
                  </strong>{' '}
                  orders and{' '}
                  <strong>
                    {formatCurrency(kpis.revenue)}
                  </strong>{' '}
                  in revenue.
                </p>

              </div>

              <Link to="/ai-query">
                <ChevronRight size={18} />
              </Link>

            </div>


            <div className="insight-card revenue-alert">

              <div className="insight-icon">
                <CircleDollarSign size={20} />
              </div>

              <div className="insight-content">

                <span>REVENUE ALERT</span>

                <h3>
                  Revenue monitoring
                </h3>

                <p>
                  Average order value is{' '}
                  <strong>
                    {formatCurrency(
                      averageOrderValue
                    )}
                  </strong>.
                </p>

              </div>

              <AlertTriangle size={19} />

            </div>


            <div className="insight-card profit-alert">

              <div className="insight-icon">
                <TrendingUp size={20} />
              </div>

              <div className="insight-content">

                <span>PROFIT ALERT</span>

                <h3>
                  Profit margin
                </h3>

                <p>
                  Current margin is{' '}
                  <strong>
                    {profitMargin.toFixed(1)}%
                  </strong>.
                </p>

              </div>

              <Activity size={19} />

            </div>


            <div className="insight-card performance-alert">

              <div className="insight-icon">
                <Zap size={20} />
              </div>

              <div className="insight-content">

                <span>PERFORMANCE ALERT</span>

                <h3>
                  Data performance
                </h3>

                <p>
                  {apiOnline
                    ? 'Live analytics services are connected.'
                    : 'Backend connection requires attention.'}
                </p>

              </div>

              {apiOnline
                ? <CheckCircle2 size={19} />
                : <AlertTriangle size={19} />}

            </div>

          </section>


          {/* =================================================
              FORECASTING
              ================================================= */}

          <section className="section-heading">

            <div>
              <span>PLANNING</span>
              <h2>Forecasting</h2>
            </div>

            <span className="section-note">
              Based on available dashboard data
            </span>

          </section>


          <section className="forecast-section">

            <div className="forecast-main dashboard-panel">

              <div className="panel-header">

                <div>
                  <span className="panel-label">
                    REVENUE FORECAST
                  </span>

                  <h3>
                    Projected Revenue
                  </h3>

                  <p>
                    Estimated next-period revenue
                  </p>
                </div>

                <div className="forecast-badge">
                  <TrendingUp size={15} />
                  +12%
                </div>

              </div>


              <div className="forecast-value">
                {formatCurrency(
                  forecastRevenue
                )}
              </div>


              <div className="forecast-chart">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart
                    data={trendData}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={
                        dark
                          ? '#273247'
                          : '#e9edf4'
                      }
                    />

                    <XAxis
                      dataKey="name"
                      hide
                    />

                    <YAxis hide />

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#7048e8"
                      strokeWidth={3}
                      dot={false}
                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>

            </div>


            <div className="forecast-side">

              <div className="forecast-stat">

                <div className="forecast-stat-icon blue">
                  <BarChart3 size={18} />
                </div>

                <div>
                  <span>
                    SALES FORECAST
                  </span>

                  <strong>
                    {formatCurrency(
                      forecastRevenue * 1.08
                    )}
                  </strong>
                </div>

              </div>


              <div className="forecast-stat">

                <div className="forecast-stat-icon green">
                  <CheckCircle2 size={18} />
                </div>

                <div>
                  <span>
                    FORECAST ACCURACY
                  </span>

                  <strong>
                    92%
                  </strong>
                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              GOALS
              ================================================= */}

          <section className="section-heading">

            <div>
              <span>OBJECTIVES</span>
              <h2>Goals</h2>
            </div>

            <span className="section-note">
              Track your business targets
            </span>

          </section>


          <section className="goals-grid">

            <div className="goal-card">

              <div className="goal-header">

                <div className="goal-icon blue">
                  <CircleDollarSign size={19} />
                </div>

                <div>
                  <span>
                    REVENUE GOAL
                  </span>

                  <strong>
                    {formatCurrency(
                      revenueGoal
                    )}
                  </strong>
                </div>

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
                  {revenueGoalProgress}%
                </strong>

                <span>
                  {formatCurrency(
                    kpis.revenue
                  )}{' '}
                  achieved
                </span>
              </div>

            </div>


            <div className="goal-card">

              <div className="goal-header">

                <div className="goal-icon green">
                  <TrendingUp size={19} />
                </div>

                <div>
                  <span>
                    PROFIT GOAL
                  </span>

                  <strong>
                    {formatCurrency(
                      profitGoal
                    )}
                  </strong>
                </div>

              </div>


              <div className="goal-progress green">

                <span
                  style={{
                    width: `${profitGoalProgress}%`,
                  }}
                />

              </div>


              <div className="goal-footer">
                <strong>
                  {profitGoalProgress}%
                </strong>

                <span>
                  {formatCurrency(
                    kpis.profit
                  )}{' '}
                  achieved
                </span>
              </div>

            </div>


            <div className="goal-summary">

              <div className="goal-summary-icon">
                <Target size={20} />
              </div>

              <div>

                <span>
                  GOAL PROGRESS
                </span>

                <strong>
                  {Math.round(
                    (
                      revenueGoalProgress +
                      profitGoalProgress
                    ) / 2
                  )}%
                </strong>

                <p>
                  Overall target progress
                </p>

              </div>

            </div>

          </section>


          {/* =================================================
              AI COPILOT
              ================================================= */}

          <section className="copilot-section">

            <div className="copilot-orb">
              <Sparkles size={25} />
            </div>

            <div className="copilot-body">

              <span>
                AI ANALYTICS COPILOT
              </span>

              <h2>
                Ask MetricMind anything.
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
                  placeholder="e.g. Which region generated the highest revenue?"
                />

                <button
                  type="submit"
                  disabled={
                    copilotLoading ||
                    !copilotQuestion.trim()
                  }
                >

                  {copilotLoading
                    ? <RefreshCw
                        size={16}
                        className="spin"
                      />
                    : <Sparkles size={16} />}

                  Ask AI

                </button>

              </form>


              <div className="copilot-answer">

                <span>
                  METRICMIND
                </span>

                <p>
                  {copilotAnswer}
                </p>

              </div>

            </div>

          </section>


          {/* =================================================
              QUICK ACTIONS
              ================================================= */}

          <section className="section-heading">

            <div>
              <span>WORKSPACE</span>
              <h2>Quick Actions</h2>
            </div>

          </section>


          <section className="quick-grid">

            <Link
              to="/add-data"
              className="quick-card"
            >
              <div className="quick-icon blue">
                <Plus size={19} />
              </div>

              <div>
                <strong>
                  Add Business Data
                </strong>

                <span>
                  Add a new sales record
                </span>
              </div>

              <ChevronRight size={17} />
            </Link>


            <Link
              to="/dataset"
              className="quick-card"
            >
              <div className="quick-icon purple">
                <Upload size={19} />
              </div>

              <div>
                <strong>
                  Upload Dataset
                </strong>

                <span>
                  Import business data
                </span>
              </div>

              <ChevronRight size={17} />
            </Link>


            <Link
              to="/ai-query"
              className="quick-card"
            >
              <div className="quick-icon cyan">
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
              className="quick-card"
            >
              <div className="quick-icon green">
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

          </section>


          {/* FOOTER */}

          <footer className="dashboard-footer">

            <div>
              <strong>
                METRICMIND
              </strong>

              <span>
                AI-powered business intelligence
              </span>
            </div>

            <div>
              <i
                className={
                  apiOnline
                    ? 'online'
                    : 'offline'
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