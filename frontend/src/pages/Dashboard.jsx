```jsx
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle,
  ChevronRight,
  CreditCard,
  Database,
  FileBarChart,
  Filter,
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
  Truck,
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

const FALLBACK_REGION = [
  { name: 'West', value: 42000 },
  { name: 'East', value: 35000 },
  { name: 'Central', value: 28000 },
  { name: 'South', value: 22000 },
]

const FALLBACK_CATEGORY = [
  { name: 'Technology', value: 35 },
  { name: 'Furniture', value: 30 },
  { name: 'Office Supplies', value: 25 },
  { name: 'Other', value: 10 },
]

const FALLBACK_TREND = [
  { name: 'Jan', revenue: 18000, profit: 4200 },
  { name: 'Feb', revenue: 23000, profit: 5800 },
  { name: 'Mar', revenue: 21000, profit: 5100 },
  { name: 'Apr', revenue: 29000, profit: 7600 },
  { name: 'May', revenue: 26000, profit: 6900 },
  { name: 'Jun', revenue: 34000, profit: 9200 },
]

const FALLBACK_PRODUCTS = [
  { name: 'Product A', value: 12400 },
  { name: 'Product B', value: 9800 },
  { name: 'Product C', value: 8700 },
  { name: 'Product D', value: 7900 },
  { name: 'Product E', value: 7100 },
]

const FALLBACK_PAYMENT = [
  { name: 'UPI', value: 38 },
  { name: 'Credit Card', value: 27 },
  { name: 'Debit Card', value: 20 },
  { name: 'Cash', value: 15 },
]

const FALLBACK_SHIPPING = [
  { name: 'Standard Class', value: 45 },
  { name: 'Second Class', value: 25 },
  { name: 'First Class', value: 20 },
  { name: 'Same Day', value: 10 },
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
    return FALLBACK_REGION
  }

  return rows.map((row) => ({
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
}

function normalizeCategory(rows) {
  if (!rows.length) {
    return FALLBACK_CATEGORY
  }

  return rows.map((row) => ({
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
}

function normalizeTrend(rows) {
  if (!rows.length) {
    return FALLBACK_TREND
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

    profit:
      Number(
        row.profit ??
        row.Profit ??
        0
      ) || 0,
  }))
}

function normalizeProducts(rows) {
  if (!rows.length) {
    return FALLBACK_PRODUCTS
  }

  return rows
    .map((row) => ({
      name:
        row.product_name ??
        row.productName ??
        row.product ??
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
          row.value ??
          row.Value ??
          0
        ) || 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
}

function normalizePayment(rows) {
  if (!rows.length) {
    return FALLBACK_PAYMENT
  }

  return rows.map((row) => ({
    name:
      row.payment_method ??
      row.paymentMethod ??
      row.name ??
      row.Name ??
      'Other',

    value:
      Number(
        row.percentage ??
        row.percent ??
        row.value ??
        row.count ??
        0
      ) || 0,
  }))
}

function normalizeShipping(rows) {
  if (!rows.length) {
    return FALLBACK_SHIPPING
  }

  return rows.map((row) => ({
    name:
      row.shipping_mode ??
      row.shippingMode ??
      row.name ??
      row.Name ??
      'Other',

    value:
      Number(
        row.percentage ??
        row.percent ??
        row.value ??
        row.count ??
        0
      ) || 0,
  }))
}


/* =========================================================
   COMPONENT
   ========================================================= */

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()

  const { dark, toggleDarkMode } = useTheme()

  const [loading, setLoading] = useState(true)
  const [apiOnline, setApiOnline] = useState(false)

  const [search, setSearch] = useState('')

  const [filterRegion, setFilterRegion] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')

  const [kpis, setKpis] = useState({
    revenue: 0,
    profit: 0,
    orders: 0,
    customers: 0,
  })

  const [regionData, setRegionData] =
    useState(FALLBACK_REGION)

  const [categoryData, setCategoryData] =
    useState(FALLBACK_CATEGORY)

  const [trendData, setTrendData] =
    useState(FALLBACK_TREND)

  const [productData, setProductData] =
    useState(FALLBACK_PRODUCTS)

  const [paymentData, setPaymentData] =
    useState(FALLBACK_PAYMENT)

  const [shippingData, setShippingData] =
    useState(FALLBACK_SHIPPING)

  const [notificationOpen, setNotificationOpen] =
    useState(false)

  const [copilotQuestion, setCopilotQuestion] =
    useState('')

  const [copilotAnswer, setCopilotAnswer] =
    useState(
      'Ask MetricMind about your revenue, profit, customers, products, or regions.'
    )

  const [copilotLoading, setCopilotLoading] =
    useState(false)


  /* =========================================================
     SIDEBAR
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

  async function loadDashboard() {
    setLoading(true)

    try {
      try {
        const response =
          await apiService.health()

        setApiOnline(
          response?.status >= 200 &&
          response?.status < 300
        )
      } catch {
        setApiOnline(false)
      }


      const results =
        await Promise.allSettled([
          apiService.getDashboardKPIs(),
          apiService.getSalesByRegion(),
          apiService.getSalesByCategory(),
          apiService.getSalesTrend('month'),
          apiService.getTopProducts(),
        ])


      const [
        kpiResult,
        regionResult,
        categoryResult,
        trendResult,
        productResult,
      ] = results


      if (kpiResult.status === 'fulfilled') {
        const data =
          kpiResult.value?.data || {}

        setKpis({
          revenue:
            Number(data.revenue ?? 0),

          profit:
            Number(data.profit ?? 0),

          orders:
            Number(data.orders ?? 0),

          customers:
            Number(data.customers ?? 0),
        })
      }


      if (regionResult.status === 'fulfilled') {
        setRegionData(
          normalizeRegion(
            extractRows(
              regionResult.value
            )
          )
        )
      }


      if (categoryResult.status === 'fulfilled') {
        setCategoryData(
          normalizeCategory(
            extractRows(
              categoryResult.value
            )
          )
        )
      }


      if (trendResult.status === 'fulfilled') {
        setTrendData(
          normalizeTrend(
            extractRows(
              trendResult.value
            )
          )
        )
      }


      if (productResult.status === 'fulfilled') {
        setProductData(
          normalizeProducts(
            extractRows(
              productResult.value
            )
          )
        )
      }

    } catch (error) {
      console.error(
        'Dashboard error:',
        error
      )
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadDashboard()
  }, [])


  /* =========================================================
     FILTERED DATA
     ========================================================= */

  const filteredProducts = useMemo(() => {
    return productData
  }, [productData])


  const categoryTotal = useMemo(() => {
    return categoryData.reduce(
      (sum, item) =>
        sum + Number(item.value || 0),
      0
    )
  }, [categoryData])


  const profitMargin = useMemo(() => {
    if (!kpis.revenue) {
      return 0
    }

    return (
      (kpis.profit /
        kpis.revenue) *
      100
    ).toFixed(1)
  }, [kpis])


  const revenueGoal = 3000000
  const profitGoal = 500000

  const revenueGoalProgress = Math.min(
    100,
    (kpis.revenue / revenueGoal) * 100
  )

  const profitGoalProgress = Math.min(
    100,
    (kpis.profit / profitGoal) * 100
  )


  /* =========================================================
     SEARCH
     ========================================================= */

  function handleSearch(event) {
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
     COPILOT
     ========================================================= */

  async function askCopilot() {
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

      const answer =
        response?.data?.answer ||
        response?.data?.message ||
        'The analytics engine returned no text response.'

      setCopilotAnswer(answer)
    } catch (error) {
      console.error(
        'AI Copilot error:',
        error
      )

      setCopilotAnswer(
        'Unable to connect to the AI analytics engine. Please check your backend.'
      )
    } finally {
      setCopilotLoading(false)
    }
  }


  /* =========================================================
     COLORS
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
          ? 'dashboard-shell dashboard-dark'
          : 'dashboard-shell dashboard-light'
      }
    >

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

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

            <Activity size={16} />

            <div>

              <strong>
                System Status
              </strong>

              <span>
                <i
                  className={
                    apiOnline
                      ? 'status-dot online'
                      : 'status-dot offline'
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

      <main className="dashboard-main">


        {/* ===================================================
            TOP BAR
            =================================================== */}

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
              className="icon-button"
              type="button"
              onClick={toggleDarkMode}
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
                className="icon-button"
                onClick={() =>
                  setNotificationOpen(
                    (value) => !value
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
                      Insights & Alerts
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


                  <div className="notification-entry">
                    <CheckCircle size={16} />

                    <div>
                      <strong>
                        Dashboard ready
                      </strong>

                      <span>
                        Your business metrics are available.
                      </span>
                    </div>
                  </div>


                  <div className="notification-entry warning">
                    <AlertTriangle size={16} />

                    <div>
                      <strong>
                        Performance monitoring
                      </strong>

                      <span>
                        Review profit and revenue trends.
                      </span>
                    </div>
                  </div>

                </div>
              )}

            </div>


            <div className="dashboard-profile">

              <div className="profile-avatar">
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

        <section className="dashboard-content">


          {/* =================================================
              HERO
              ================================================= */}

          <div className="dashboard-hero">

            <div>

              <span className="hero-label">
                BUSINESS INTELLIGENCE PLATFORM
              </span>

              <h1>
                Business Performance
                <span> at a glance.</span>
              </h1>

              <p>
                Analyze revenue, profit, customers,
                products and operations from one
                intelligent workspace.
              </p>

            </div>


            <div className="hero-actions">

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
              DASHBOARD FILTERS
              ================================================= */}

          <section className="dashboard-filter-bar">

            <div className="filter-title">
              <Filter size={17} />

              <div>
                <strong>
                  Dashboard Filters
                </strong>

                <span>
                  Filter your business view
                </span>
              </div>
            </div>


            <select
              value={filterRegion}
              onChange={(event) =>
                setFilterRegion(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Regions
              </option>

              {regionData.map(
                (region) => (
                  <option
                    key={region.name}
                    value={region.name}
                  >
                    {region.name}
                  </option>
                )
              )}
            </select>


            <select
              value={filterCategory}
              onChange={(event) =>
                setFilterCategory(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Categories
              </option>

              {categoryData.map(
                (category) => (
                  <option
                    key={category.name}
                    value={category.name}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>


            <button
              type="button"
              onClick={() => {
                setFilterRegion('All')
                setFilterCategory('All')
              }}
            >
              Reset
            </button>

          </section>


          {/* =================================================
              1. KPI OVERVIEW
              ================================================= */}

          <section className="section-block">

            <SectionHeading
              eyebrow="01 · PERFORMANCE"
              title="KPI Overview"
              subtitle="Your most important business metrics."
            />


            <div className="kpi-grid">

              <KpiCard
                title="Revenue"
                value={formatCurrency(kpis.revenue)}
                icon={<TrendingUp size={20} />}
                className="blue"
                loading={loading}
              />

              <KpiCard
                title="Profit"
                value={formatCurrency(kpis.profit)}
                icon={<Activity size={20} />}
                className="green"
                loading={loading}
              />

              <KpiCard
                title="Orders"
                value={formatNumber(kpis.orders)}
                icon={<ShoppingCart size={20} />}
                className="purple"
                loading={loading}
              />

              <KpiCard
                title="Customers"
                value={formatNumber(kpis.customers)}
                icon={<Users size={20} />}
                className="cyan"
                loading={loading}
              />

              <KpiCard
                title="Profit Margin"
                value={`${profitMargin}%`}
                icon={<Target size={20} />}
                className="orange"
                loading={loading}
              />

            </div>

          </section>


          {/* =================================================
              2. REVENUE & PROFIT ANALYTICS
              ================================================= */}

          <section className="section-block">

            <SectionHeading
              eyebrow="02 · ANALYTICS"
              title="Revenue & Profit Analytics"
              subtitle="Track how revenue and profit move over time."
            />


            <div className="two-column-grid">

              <div className="dashboard-card large-card">

                <CardHeader
                  title="Revenue & Profit Trend"
                  subtitle="Monthly performance"
                  icon={<TrendingUp size={18} />}
                />


                <div className="chart-large">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <LineChart data={trendData}>

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
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#3155ff"
                        strokeWidth={3}
                        dot={false}
                      />

                      <Line
                        type="monotone"
                        dataKey="profit"
                        name="Profit"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={false}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              </div>


              <div className="dashboard-card">

                <CardHeader
                  title="Performance Summary"
                  subtitle="Current business health"
                  icon={<Activity size={18} />}
                />


                <div className="summary-list">

                  <SummaryRow
                    label="Revenue"
                    value={formatCurrency(kpis.revenue)}
                    positive
                  />

                  <SummaryRow
                    label="Profit"
                    value={formatCurrency(kpis.profit)}
                    positive
                  />

                  <SummaryRow
                    label="Profit Margin"
                    value={`${profitMargin}%`}
                    positive
                  />

                  <SummaryRow
                    label="Orders"
                    value={formatNumber(kpis.orders)}
                  />

                  <SummaryRow
                    label="Customers"
                    value={formatNumber(kpis.customers)}
                  />

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              3. FORECASTING
              ================================================= */}

          <section className="section-block">

            <SectionHeading
              eyebrow="03 · PREDICTIVE"
              title="Forecasting"
              subtitle="Prepare for future business performance."
            />


            <div className="forecast-grid">

              <ForecastCard
                title="Revenue Forecast"
                value={formatCurrency(
                  kpis.revenue * 1.12
                )}
                icon={<TrendingUp size={20} />}
                description="Projected next period"
              />

              <ForecastCard
                title="Sales Forecast"
                value={formatNumber(
                  Math.round(
                    kpis.orders * 1.1
                  )
                )}
                icon={<ShoppingCart size={20} />}
                description="Expected order volume"
              />

              <ForecastCard
                title="Forecast Accuracy"
                value="—"
                icon={<Target size={20} />}
                description="Train a forecasting model to calculate accuracy"
              />

            </div>

          </section>


          {/* =================================================
              4. GOALS
              ================================================= */}

          <section className="section-block">

            <SectionHeading
              eyebrow="04 · TARGETS"
              title="Goals"
              subtitle="Track progress toward your business targets."
            />


            <div className="goals-grid">

              <GoalCard
                title="Revenue Goal"
                current={kpis.revenue}
                goal={revenueGoal}
                progress={revenueGoalProgress}
              />

              <GoalCard
                title="Profit Goal"
                current={kpis.profit}
                goal={profitGoal}
                progress={profitGoalProgress}
              />

              <div className="dashboard-card goal-info">

                <div className="goal-icon">
                  <Target size={21} />
                </div>

                <div>
                  <strong>
                    Goal Tracking
                  </strong>

                  <p>
                    Goals can be configured later
                    from Settings.
                  </p>
                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              5. INSIGHTS & ALERTS
              ================================================= */}

          <section className="section-block">

            <SectionHeading
              eyebrow="05 · INTELLIGENCE"
              title="Insights & Alerts"
              subtitle="Important signals from your business data."
            />


            <div className="alerts-grid">

              <AlertCard
                type="AI Insight"
                icon={<Sparkles size={18} />}
                title="Business overview"
                text="Use the AI Business Copilot to investigate revenue, profit and regional performance."
              />

              <AlertCard
                type="Revenue Alert"
                icon={<TrendingUp size={18} />}
                title="Revenue monitoring"
                text={`Current revenue is ${formatCurrency(kpis.revenue)}.`}
              />

              <AlertCard
                type="Profit Alert"
                icon={<Activity size={18} />}
                title="Profit monitoring"
                text={`Current profit margin is ${profitMargin}%.`}
              />

              <AlertCard
                type="Performance Alert"
                icon={<AlertTriangle size={18} />}
                title="Review performance"
                text="Compare your regions and products to identify areas that need attention."
              />

            </div>

          </section>


          {/* =================================================
              6. REGIONAL PERFORMANCE
              ================================================= */}

          <section className="section-block">

            <SectionHeading
              eyebrow="06 · GEOGRAPHY"
              title="Regional Performance"
              subtitle="Understand where your business is generating revenue."
            />


            <div className="dashboard-card">

              <div className="chart-medium">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={
                      filterRegion === 'All'
                        ? regionData
                        : regionData.filter(
                            (item) =>
                              item.name ===
                              filterRegion
                          )
                    }
                    layout="vertical"
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      axisLine={false}
                      tickLine={false}
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
                        8,
                        8,
                        0,
                      ]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>

          </section>


          {/* =================================================
              7. PRODUCT PERFORMANCE
              ================================================= */}

          <section className="section-block">

            <SectionHeading
              eyebrow="07 · PRODUCTS"
              title="Product Performance"
              subtitle="Your highest-value products."
            />


            <div className="product-performance-grid">

              {filteredProducts.map(
                (product, index) => {

                  const maximum =
                    productData[0]?.value || 1

                  const width =
                    Math.min(
                      100,
                      Math.max(
                        8,
                        (product.value /
                          maximum) *
                          100
                      )
                    )

                  return (
                    <div
                      className="product-card"
                      key={`${product.name}-${index}`}
                    >

                      <div className="product-number">
                        0{index + 1}
                      </div>

                      <div className="product-card-main">

                        <strong>
                          {product.name}
                        </strong>

                        <span>
                          {formatCurrency(
                            product.value
                          )}
                        </span>

                        <div className="product-progress">
                          <i
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          </section>


          {/* =================================================
              8. CUSTOMER ANALYTICS
              ================================================= */}

          <section className="section-block">

            <SectionHeading
              eyebrow="08 · CUSTOMERS"
              title="Customer Analytics"
              subtitle="Monitor customer scale and engagement."
            />


            <div className="customer-grid">

              <div className="dashboard-card customer-highlight">

                <div className="big-icon blue">
                  <Users size={24} />
                </div>

                <span>
                  TOTAL CUSTOMERS
                </span>

                <strong>
                  {formatNumber(kpis.customers)}
                </strong>

                <small>
                  Unique customers in dataset
                </small>

              </div>


              <div className="dashboard-card customer-highlight">

                <div className="big-icon purple">
                  <ShoppingCart size={24} />
                </div>

                <span>
                  ORDERS PER CUSTOMER
                </span>

                <strong>
                  {kpis.customers
                    ? (
                        kpis.orders /
                        kpis.customers
                      ).toFixed(1)
                    : '0.0'}
                </strong>

                <small>
                  Average orders per customer
                </small>

              </div>


              <div className="dashboard-card customer-highlight">

                <div className="big-icon green">
                  <CreditCard size={24} />
                </div>

                <span>
                  CUSTOMER VALUE
                </span>

                <strong>
                  {kpis.customers
                    ? formatCurrency(
                        kpis.revenue /
                          kpis.customers
                      )
                    : '$0'}
                </strong>

                <small>
                  Average revenue per customer
                </small>

              </div>

            </div>

          </section>


          {/* =================================================
              9. PAYMENT & SHIPPING
              ================================================= */}

          <section className="section-block">

            <SectionHeading
              eyebrow="09 · OPERATIONS"
              title="Payment & Shipping"
              subtitle="Monitor transaction and delivery preferences."
            />


            <div className="two-column-grid">

              <div className="dashboard-card">

                <CardHeader
                  title="Payment Methods"
                  subtitle="Transaction distribution"
                  icon={<CreditCard size={18} />}
                />


                <div className="mini-list">

                  {paymentData.map(
                    (item, index) => (
                      <div
                        className="mini-list-row"
                        key={`${item.name}-${index}`}
                      >

                        <span>
                          {item.name}
                        </span>

                        <strong>
                          {item.value}%
                        </strong>

                      </div>
                    )
                  )}

                </div>

              </div>


              <div className="dashboard-card">

                <CardHeader
                  title="Shipping Modes"
                  subtitle="Delivery distribution"
                  icon={<Truck size={18} />}
                />


                <div className="mini-list">

                  {shippingData.map(
                    (item, index) => (
                      <div
                        className="mini-list-row"
                        key={`${item.name}-${index}`}
                      >

                        <span>
                          {item.name}
                        </span>

                        <strong>
                          {item.value}%
                        </strong>

                      </div>
                    )
                  )}

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              10. AI BUSINESS COPILOT
              ================================================= */}

          <section className="section-block">

            <SectionHeading
              eyebrow="10 · AI"
              title="AI Business Copilot"
              subtitle="Ask questions about your business data in natural language."
            />


            <div className="copilot-card">

              <div className="copilot-symbol">
                <Sparkles size={28} />
              </div>

              <div className="copilot-main">

                <h2>
                  Ask MetricMind
                </h2>

                <p>
                  Ask about revenue, profit,
                  customers, regions, products,
                  or trends.
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
                    placeholder="Example: Which region generated the highest revenue?"
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


                <div className="copilot-response">

                  <span>
                    METRICMIND
                  </span>

                  <p>
                    {copilotAnswer}
                  </p>

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              11. DATASET STATUS
              ================================================= */}

          <section className="section-block">

            <SectionHeading
              eyebrow="11 · DATA"
              title="Dataset Status"
              subtitle="Check the connection between MetricMind and your business data."
            />


            <div className="dataset-status-card">

              <div className="dataset-status-icon">
                <Database size={24} />
              </div>


              <div className="dataset-status-main">

                <span>
                  ACTIVE DATA SOURCE
                </span>

                <h3>
                  MetricMind Business Dataset
                </h3>

                <p>
                  Dashboard metrics are connected
                  to the backend analytics service.
                </p>

              </div>


              <div
                className={
                  apiOnline
                    ? 'dataset-status-pill connected'
                    : 'dataset-status-pill'
                }
              >

                <i />

                {apiOnline
                  ? 'Connected'
                  : 'Offline'}

              </div>


              <Link
                to="/dataset"
                className="dataset-open-button"
              >
                Open Dataset
                <ChevronRight size={16} />
              </Link>

            </div>

          </section>


          {/* =================================================
              12. QUICK ACTIONS
              ================================================= */}

          <section className="section-block">

            <SectionHeading
              eyebrow="12 · WORKSPACE"
              title="Quick Actions"
              subtitle="Jump directly to the tools you use most."
            />


            <div className="quick-actions-grid">

              <QuickAction
                to="/dataset"
                icon={<Database size={20} />}
                title="Dataset"
                text="View and manage business data"
              />

              <QuickAction
                to="/add-data"
                icon={<Plus size={20} />}
                title="Add Data"
                text="Add a new business record"
              />

              <QuickAction
                to="/analytics"
                icon={<BarChart3 size={20} />}
                title="Analytics"
                text="Explore detailed analytics"
              />

              <QuickAction
                to="/ai-query"
                icon={<Sparkles size={20} />}
                title="AI Query"
                text="Ask questions using AI"
              />

              <QuickAction
                to="/reports"
                icon={<FileBarChart size={20} />}
                title="Reports"
                text="Generate business reports"
              />

            </div>

          </section>


          {/* =================================================
              13. FOOTER
              ================================================= */}

          <footer className="dashboard-footer">

            <div>

              <strong>
                METRICMIND
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


/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}) {
  return (
    <div className="section-heading">

      <div>

        <span>
          {eyebrow}
        </span>

        <h2>
          {title}
        </h2>

        <p>
          {subtitle}
        </p>

      </div>

    </div>
  )
}


function CardHeader({
  title,
  subtitle,
  icon,
}) {
  return (
    <div className="card-header">

      <div>

        <h3>
          {title}
        </h3>

        <p>
          {subtitle}
        </p>

      </div>

      <div className="card-header-icon">
        {icon}
      </div>

    </div>
  )
}


function KpiCard({
  title,
  value,
  icon,
  className,
  loading,
}) {
  return (
    <div className={`kpi-card ${className}`}>

      <div className="kpi-card-top">

        <div className="kpi-card-icon">
          {icon}
        </div>

        <span>
          {title}
        </span>

      </div>

      <strong>
        {loading ? '—' : value}
      </strong>

      <div className="kpi-card-bottom">

        <TrendingUp size={13} />

        Live dashboard metric

      </div>

    </div>
  )
}


function SummaryRow({
  label,
  value,
  positive,
}) {
  return (
    <div className="summary-row">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      {positive && (
        <TrendingUp size={14} />
      )}

    </div>
  )
}


function ForecastCard({
  title,
  value,
  icon,
  description,
}) {
  return (
    <div className="dashboard-card forecast-card">

      <div className="forecast-icon">
        {icon}
      </div>

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <p>
        {description}
      </p>

    </div>
  )
}


function GoalCard({
  title,
  current,
  goal,
  progress,
}) {
  return (
    <div className="dashboard-card goal-card">

      <div className="goal-top">

        <div>

          <span>
            {title}
          </span>

          <strong>
            {formatCurrency(current)}
          </strong>

        </div>

        <Target size={21} />

      </div>


      <div className="goal-progress">

        <i
          style={{
            width: `${progress}%`,
          }}
        />

      </div>


      <div className="goal-bottom">

        <span>
          {progress.toFixed(0)}% complete
        </span>

        <span>
          Goal {formatCurrency(goal)}
        </span>

      </div>

    </div>
  )
}


function AlertCard({
  type,
  icon,
  title,
  text,
}) {
  return (
    <div className="alert-card">

      <div className="alert-icon">
        {icon}
      </div>

      <div>

        <span>
          {type}
        </span>

        <strong>
          {title}
        </strong>

        <p>
          {text}
        </p>

      </div>

    </div>
  )
}


function QuickAction({
  to,
  icon,
  title,
  text,
}) {
  return (
    <Link
      to={to}
      className="quick-action"
    >

      <div className="quick-action-icon">
        {icon}
      </div>

      <div>

        <strong>
          {title}
        </strong>

        <span>
          {text}
        </span>

      </div>

      <ChevronRight size={17} />

    </Link>
  )
}
```
