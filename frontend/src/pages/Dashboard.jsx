import { useEffect, useState } from 'react'

import {
  Activity,
  BarChart3,
  Database,
  Moon,
  PieChart,
  RefreshCw,
  Sparkles,
  Sun,
  TrendingUp,
  Users,
  ShoppingCart,
  Upload,
} from 'lucide-react'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import { Link } from 'react-router-dom'

import { apiService } from '../services/api'
import { useTheme } from '../context/ThemeContext'

import './Dashboard.css'


// ======================================================
// FALLBACK DATA
// ======================================================

const fallbackRegion = [
  { region: 'West', revenue: 0 },
  { region: 'East', revenue: 0 },
  { region: 'Central', revenue: 0 },
  { region: 'South', revenue: 0 },
]

const fallbackCategory = [
  { category: 'Technology', revenue: 0 },
  { category: 'Furniture', revenue: 0 },
  { category: 'Office Supplies', revenue: 0 },
]

const fallbackTrend = [
  { period: 'Jan', revenue: 0 },
  { period: 'Feb', revenue: 0 },
  { period: 'Mar', revenue: 0 },
  { period: 'Apr', revenue: 0 },
  { period: 'May', revenue: 0 },
  { period: 'Jun', revenue: 0 },
]


// ======================================================
// HELPERS
// ======================================================

function getNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,\s]/g, '')
    const number = Number(cleaned)

    if (Number.isFinite(number)) {
      return number
    }

    const match = value.match(/-?[\d,]+(?:\.\d+)?/)

    if (match) {
      return Number(match[0].replace(/,/g, ''))
    }
  }

  return 0
}


function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(getNumber(value))
}


function getResponsePayload(response) {
  if (!response) {
    return {}
  }

  // Axios response
  if (response.data && !Array.isArray(response.data)) {
    return response.data
  }

  // Already-unwrapped API response
  return response
}


function getRows(response) {
  const payload = getResponsePayload(response)

  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (Array.isArray(payload.rows)) {
    return payload.rows
  }

  if (Array.isArray(payload.results)) {
    return payload.results
  }

  if (Array.isArray(payload.regions)) {
    return payload.regions
  }

  if (Array.isArray(payload.categories)) {
    return payload.categories
  }

  if (Array.isArray(payload.trend)) {
    return payload.trend
  }

  return []
}


function getMetricValue(response, keys = []) {
  const payload = getResponsePayload(response)

  const rows = getRows(response)

  if (rows.length > 0) {
    const firstRow = rows[0]

    for (const key of keys) {
      if (
        firstRow[key] !== undefined &&
        firstRow[key] !== null
      ) {
        return getNumber(firstRow[key])
      }
    }

    // If backend returned one numeric column with another name
    const numericValue = Object.values(firstRow).find(
      (value) =>
        typeof value === 'number' ||
        (
          typeof value === 'string' &&
          Number.isFinite(
            Number(value.replace(/[$,\s]/g, ''))
          )
        )
    )

    if (numericValue !== undefined) {
      return getNumber(numericValue)
    }
  }

  // Try direct fields
  for (const key of keys) {
    if (
      payload[key] !== undefined &&
      payload[key] !== null
    ) {
      return getNumber(payload[key])
    }
  }

  // Try answer
  if (payload.answer !== undefined) {
    return getNumber(payload.answer)
  }

  // Try value
  if (payload.value !== undefined) {
    return getNumber(payload.value)
  }

  return 0
}


function normalizeRegionData(response) {
  const rows = getRows(response)

  return rows
    .map((item) => ({
      region:
        item.region ??
        item.Region ??
        item.name ??
        item.Name ??
        'Unknown',

      revenue: getNumber(
        item.revenue ??
        item.sales ??
        item.total_revenue ??
        item.total_sales ??
        item.value ??
        item.profit
      ),
    }))
    .filter(
      (item) =>
        item.region !== 'Unknown' ||
        item.revenue !== 0
    )
}


function normalizeCategoryData(response) {
  const rows = getRows(response)

  return rows
    .map((item) => ({
      category:
        item.category ??
        item.Category ??
        item.name ??
        item.Name ??
        'Unknown',

      revenue: getNumber(
        item.revenue ??
        item.sales ??
        item.total_revenue ??
        item.total_sales ??
        item.value ??
        item.profit
      ),
    }))
    .filter(
      (item) =>
        item.category !== 'Unknown' ||
        item.revenue !== 0
    )
}


function normalizeTrendData(response) {
  const rows = getRows(response)

  return rows
    .map((item) => ({
      period:
        item.period ??
        item.month ??
        item.date ??
        item.year ??
        item.Month ??
        item.Date ??
        'Period',

      revenue: getNumber(
        item.revenue ??
        item.sales ??
        item.total_revenue ??
        item.total_sales ??
        item.value
      ),
    }))
    .filter(
      (item) =>
        item.period !== 'Period' ||
        item.revenue !== 0
    )
}


// ======================================================
// LOGO
// ======================================================

function Logo() {
  return (
    <div className="metric-logo">
      <div className="metric-logo-icon">
        <Sparkles size={26} />
      </div>

      <div>
        <strong>MetricMind</strong>
        <span>Business Intelligence</span>
      </div>
    </div>
  )
}


// ======================================================
// KPI CARD
// ======================================================

function KPI({
  icon,
  title,
  value,
  description,
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon">
        {icon}
      </div>

      <div className="kpi-content">
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  )
}


// ======================================================
// DASHBOARD
// ======================================================

export default function Dashboard() {
  const { isDark, toggleTheme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [backendOnline, setBackendOnline] = useState(false)
  const [error, setError] = useState('')

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


  // ====================================================
  // LOAD DASHBOARD
  // ====================================================

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      // ----------------------------------------------
      // BACKEND HEALTH
      // ----------------------------------------------

      const health = await apiService.health()

      console.log(
        'MetricMind health:',
        health
      )

      setBackendOnline(true)


      // ----------------------------------------------
      // DASHBOARD REQUESTS
      // ----------------------------------------------

      const requests =
        await Promise.allSettled([
          apiService.getDashboardKPIs(),
          apiService.getSalesByRegion(),
          apiService.getSalesByCategory(),
          apiService.getSalesTrend('month'),
        ])


      const [
        kpiResult,
        regionResult,
        categoryResult,
        trendResult,
      ] = requests


      // ----------------------------------------------
      // KPI
      // ----------------------------------------------

      if (
        kpiResult.status === 'fulfilled'
      ) {
        console.log(
          'MetricMind KPI response:',
          kpiResult.value
        )

        const data =
          kpiResult.value?.data ||
          kpiResult.value ||
          {}

        setKpis({
          revenue: getNumber(
            data.total_revenue ??
            data.totalRevenue ??
            data.revenue ??
            data.sales
          ),

          profit: getNumber(
            data.total_profit ??
            data.totalProfit ??
            data.profit
          ),

          orders: getNumber(
            data.total_orders ??
            data.totalOrders ??
            data.orders ??
            data.order_count
          ),

          customers: getNumber(
            data.total_customers ??
            data.totalCustomers ??
            data.customers ??
            data.customer_count
          ),
        })
      }


      // ----------------------------------------------
      // REGION
      // ----------------------------------------------

      if (
        regionResult.status === 'fulfilled'
      ) {
        console.log(
          'Region response:',
          regionResult.value
        )

        const normalized =
          normalizeRegionData(
            regionResult.value
          )

        if (normalized.length > 0) {
          setRegionData(normalized)
        }
      }


      // ----------------------------------------------
      // CATEGORY
      // ----------------------------------------------

      if (
        categoryResult.status === 'fulfilled'
      ) {
        console.log(
          'Category response:',
          categoryResult.value
        )

        const normalized =
          normalizeCategoryData(
            categoryResult.value
          )

        if (normalized.length > 0) {
          setCategoryData(normalized)
        }
      }


      // ----------------------------------------------
      // TREND
      // ----------------------------------------------

      if (
        trendResult.status === 'fulfilled'
      ) {
        console.log(
          'Trend response:',
          trendResult.value
        )

        const normalized =
          normalizeTrendData(
            trendResult.value
          )

        if (normalized.length > 0) {
          setTrendData(normalized)
        }
      }


      // ----------------------------------------------
      // PARTIAL FAILURE MESSAGE
      // ----------------------------------------------

      const failedRequests =
        requests.filter(
          (item) =>
            item.status === 'rejected'
        )

      if (
        failedRequests.length ===
        requests.length
      ) {
        setError(
          'Backend is online, but dashboard analytics could not be loaded.'
        )
      } else if (
        failedRequests.length > 0
      ) {
        console.warn(
          'Some dashboard requests failed:',
          failedRequests
        )
      }

    } catch (err) {
      console.error(
        'Dashboard error:',
        err
      )

      setBackendOnline(false)

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Backend is not available. Start MetricMind backend on port 8001.'
      )
    } finally {
      setLoading(false)
    }
  }


  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    loadDashboard()
  }, [])


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="dashboard-page">

      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}

      <header className="dashboard-header">

        <Logo />

        <div className="header-actions">

          <div
            className={
              backendOnline
                ? 'api-status online'
                : 'api-status offline'
            }
          >
            <span />
            {backendOnline
              ? 'API Online'
              : 'API Offline'}
          </div>


          <button
            type="button"
            className="icon-button"
            onClick={toggleTheme}
            title="Toggle light/dark mode"
          >
            {isDark ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}
          </button>


          <button
            type="button"
            className="refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            <RefreshCw
              size={18}
              className={
                loading
                  ? 'spin'
                  : ''
              }
            />

            {loading
              ? 'Loading...'
              : 'Refresh'}
          </button>


          <Link
            to="/dataset"
            className="upload-button"
          >
            <Upload size={18} />
            Upload Dataset
          </Link>

        </div>

      </header>


      {/* ============================================ */}
      {/* MAIN */}
      {/* ============================================ */}

      <main className="dashboard-main">


        {/* ========================================== */}
        {/* HERO */}
        {/* ========================================== */}

        <section className="hero-section">

          <div>

            <p className="eyebrow">
              METRICMIND INTELLIGENCE
            </p>

            <h1>
              Good morning,
              <br />
              <span>there.</span>
            </h1>

            <p className="hero-description">
              A live pulse check of your
              business performance.
            </p>

          </div>


          <div className="hero-badge">
            <Activity size={18} />
            Live analytics
          </div>

        </section>


        {/* ========================================== */}
        {/* ERROR */}
        {/* ========================================== */}

        {error && (
          <div className="error-banner">

            <Database size={20} />

            <div>
              <strong>
                Dashboard connection problem
              </strong>

              <p>
                {error}
              </p>
            </div>

          </div>
        )}


        {/* ========================================== */}
        {/* KPI */}
        {/* ========================================== */}

        <section className="kpi-grid">

          <KPI
            icon={<TrendingUp />}
            title="Total Revenue"
            value={formatCurrency(
              kpis.revenue
            )}
            description="Revenue from all transactions"
          />

          <KPI
            icon={<Activity />}
            title="Total Profit"
            value={formatCurrency(
              kpis.profit
            )}
            description="Net profit after costs"
          />

          <KPI
            icon={<ShoppingCart />}
            title="Total Orders"
            value={kpis.orders.toLocaleString()}
            description="Number of unique orders"
          />

          <KPI
            icon={<Users />}
            title="Customers"
            value={kpis.customers.toLocaleString()}
            description="Unique customer count"
          />

        </section>


        {/* ========================================== */}
        {/* AI COPILOT */}
        {/* ========================================== */}

        <section className="copilot-card">

          <div className="copilot-icon">
            <Sparkles size={28} />
          </div>


          <div className="copilot-content">

            <span>
              YOUR ANALYTICS COPILOT
            </span>

            <h2>
              Turn your business data into
              clear decisions.
            </h2>

            <p>
              Ask questions about your dataset
              using natural language.
            </p>

          </div>


          {/* IMPORTANT:
              React Router Link is used here.
              This will open /query without
              reloading the application.
          */}

          <Link
            to="/query"
            className="copilot-button"
          >
            <Sparkles size={18} />
            Ask a Question
          </Link>

        </section>


        {/* ========================================== */}
        {/* CHARTS */}
        {/* ========================================== */}

        <section className="charts-grid">


          {/* REGION */}
          <div className="chart-card">

            <div className="chart-header">

              <div className="chart-title">

                <BarChart3 size={22} />

                <div>
                  <h3>
                    Revenue by Region
                  </h3>

                  <p>
                    Compare revenue across regions
                  </p>
                </div>

              </div>

            </div>


            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={330}
              >

                <BarChart
                  data={regionData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="region"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    radius={[
                      8,
                      8,
                      0,
                      0,
                    ]}
                    fill="#3155ff"
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>


          {/* CATEGORY */}
          <div className="chart-card">

            <div className="chart-header">

              <div className="chart-title">

                <PieChart size={22} />

                <div>
                  <h3>
                    Revenue Distribution
                  </h3>

                  <p>
                    Revenue share by category
                  </p>
                </div>

              </div>

            </div>


            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={330}
              >

                <RechartsPieChart>

                  <Pie
                    data={categoryData}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={115}
                    innerRadius={55}
                    paddingAngle={3}
                  >

                    {categoryData.map(
                      (_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              '#3155ff',
                              '#7c3aed',
                              '#06b6d4',
                              '#10b981',
                              '#f59e0b',
                            ][
                              index % 5
                            ]
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                  <Legend />

                </RechartsPieChart>

              </ResponsiveContainer>

            </div>

          </div>

        </section>


        {/* ========================================== */}
        {/* TREND */}
        {/* ========================================== */}

        <section className="chart-card full-chart">

          <div className="chart-header">

            <div className="chart-title">

              <TrendingUp size={22} />

              <div>

                <h3>
                  Revenue Trend
                </h3>

                <p>
                  Track revenue performance
                  over time
                </p>

              </div>

            </div>

          </div>


          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height={350}
            >

              <LineChart
                data={trendData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  formatter={(value) =>
                    formatCurrency(value)
                  }
                />

                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#3155ff"
                  strokeWidth={4}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </section>


        {/* ========================================== */}
        {/* QUICK ACTIONS */}
        {/* ========================================== */}

        <section className="quick-actions">

          <Link
            to="/query"
            className="quick-action-card"
          >
            <Sparkles size={22} />

            <div>
              <strong>
                Ask MetricMind
              </strong>

              <span>
                Ask questions using natural
                language
              </span>
            </div>
          </Link>


          <Link
            to="/dataset"
            className="quick-action-card"
          >
            <Upload size={22} />

            <div>
              <strong>
                Manage Dataset
              </strong>

              <span>
                Upload or activate your data
              </span>
            </div>
          </Link>

        </section>

      </main>


      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}

      <footer className="dashboard-footer">

        <span>
          © 2026 MetricMind
        </span>

        <span>
          AI-powered business intelligence
        </span>

      </footer>

    </div>
  )
}