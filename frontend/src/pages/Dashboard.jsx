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
  ArrowUpRight,
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


/* =====================================================
   FALLBACK DATA
===================================================== */

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


/* =====================================================
   HELPERS
===================================================== */

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


function getPayload(response) {
  if (!response) return {}

  if (
    response.data &&
    typeof response.data === 'object'
  ) {
    return response.data
  }

  return response
}


function getRows(response) {
  const payload = getPayload(response)

  if (Array.isArray(payload)) return payload

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


function normalizeRegionData(response) {
  return getRows(response)
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
    .filter((item) => item.region !== 'Unknown')
}


function normalizeCategoryData(response) {
  return getRows(response)
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
    .filter((item) => item.category !== 'Unknown')
}


function normalizeTrendData(response) {
  return getRows(response)
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
    .filter((item) => item.period !== 'Period')
}


/* =====================================================
   KPI CARD
===================================================== */

function KPICard({
  icon,
  title,
  value,
  description,
}) {
  return (
    <div className="dashboard-kpi">

      <div className="dashboard-kpi-top">

        <div className="dashboard-kpi-icon">
          {icon}
        </div>

        <ArrowUpRight
          size={18}
          className="dashboard-kpi-arrow"
        />

      </div>

      <div className="dashboard-kpi-title">
        {title}
      </div>

      <div className="dashboard-kpi-value">
        {value}
      </div>

      <div className="dashboard-kpi-description">
        {description}
      </div>

    </div>
  )
}


/* =====================================================
   DASHBOARD
===================================================== */

export default function Dashboard() {

  /*
   IMPORTANT:
   ThemeContext provides:
   dark
   toggleDarkMode

   NOT isDark / toggleTheme
  */

  const {
    dark,
    toggleDarkMode,
  } = useTheme()


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


  /* ===================================================
     LOAD DATA
  =================================================== */

  async function loadDashboard() {

    setLoading(true)
    setError('')

    try {

      const health =
        await apiService.health()

      console.log(
        'MetricMind health:',
        health
      )

      setBackendOnline(true)


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


      /* KPI */

      if (
        kpiResult.status === 'fulfilled'
      ) {

        console.log(
          'MetricMind KPI response:',
          kpiResult.value
        )

        const data =
          getPayload(kpiResult.value)

        setKpis({

          revenue:
            getNumber(
              data.total_revenue ??
              data.totalRevenue ??
              data.revenue ??
              data.sales
            ),

          profit:
            getNumber(
              data.total_profit ??
              data.totalProfit ??
              data.profit
            ),

          orders:
            getNumber(
              data.total_orders ??
              data.totalOrders ??
              data.orders ??
              data.order_count
            ),

          customers:
            getNumber(
              data.total_customers ??
              data.totalCustomers ??
              data.customers ??
              data.customer_count
            ),

        })
      }


      /* REGION */

      if (
        regionResult.status === 'fulfilled'
      ) {

        const normalized =
          normalizeRegionData(
            regionResult.value
          )

        if (normalized.length) {
          setRegionData(normalized)
        }
      }


      /* CATEGORY */

      if (
        categoryResult.status === 'fulfilled'
      ) {

        const normalized =
          normalizeCategoryData(
            categoryResult.value
          )

        if (normalized.length) {
          setCategoryData(normalized)
        }
      }


      /* TREND */

      if (
        trendResult.status === 'fulfilled'
      ) {

        const normalized =
          normalizeTrendData(
            trendResult.value
          )

        if (normalized.length) {
          setTrendData(normalized)
        }
      }


      const failures =
        requests.filter(
          (item) =>
            item.status === 'rejected'
        )

      if (
        failures.length ===
        requests.length
      ) {
        setError(
          'Backend is online, but dashboard analytics could not be loaded.'
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
        'Backend is not available.'
      )

    } finally {

      setLoading(false)

    }
  }


  useEffect(() => {
    loadDashboard()
  }, [])


  /* ===================================================
     RENDER
  =================================================== */

  return (

    <div
      className={`new-dashboard ${
        dark ? 'dashboard-dark' : 'dashboard-light'
      }`}
    >

      {/* ==============================================
          TOP BAR
      ============================================== */}

      <header className="new-dashboard-header">

        <div className="dashboard-brand">

          <div className="dashboard-brand-icon">
            <Sparkles size={22} />
          </div>

          <div>
            <strong>
              MetricMind
            </strong>

            <span>
              Business Intelligence
            </span>
          </div>

        </div>


        <div className="dashboard-header-actions">

          <div
            className={
              backendOnline
                ? 'new-api-status online'
                : 'new-api-status offline'
            }
          >
            <span />
            {backendOnline
              ? 'API Online'
              : 'API Offline'}
          </div>


          <button
            type="button"
            className="theme-button"
            onClick={toggleDarkMode}
            title="Toggle dark mode"
          >
            {dark
              ? <Sun size={19} />
              : <Moon size={19} />}
          </button>


          <button
            type="button"
            className="new-refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading ? 'spin' : ''
              }
            />

            {loading
              ? 'Loading'
              : 'Refresh'}
          </button>


          <Link
            to="/dataset"
            className="new-upload-button"
          >
            <Upload size={17} />
            Dataset
          </Link>

        </div>

      </header>


      {/* ==============================================
          MAIN
      ============================================== */}

      <main className="new-dashboard-main">


        {/* HERO */}

        <section className="dashboard-hero">

          <div className="hero-left">

            <div className="hero-label">
              <Activity size={15} />
              LIVE BUSINESS INTELLIGENCE
            </div>

            <h1>
              Your business,
              <br />
              <span>at a glance.</span>
            </h1>

            <p>
              Monitor revenue, profit, customers and
              sales performance from one intelligent workspace.
            </p>

          </div>


          <div className="hero-right">

            <div className="hero-stat">
              <span>Data Status</span>

              <strong>
                {backendOnline
                  ? 'Connected'
                  : 'Offline'}
              </strong>

              <small>
                MetricMind API
              </small>
            </div>

          </div>

        </section>


        {/* ERROR */}

        {error && (

          <div className="new-error">

            <Database size={20} />

            <div>
              <strong>
                Dashboard connection issue
              </strong>

              <p>
                {error}
              </p>
            </div>

          </div>

        )}


        {/* KPI GRID */}

        <section className="dashboard-kpi-grid">

          <KPICard
            icon={<TrendingUp size={22} />}
            title="Total Revenue"
            value={formatCurrency(
              kpis.revenue
            )}
            description="Revenue from all transactions"
          />

          <KPICard
            icon={<Activity size={22} />}
            title="Total Profit"
            value={formatCurrency(
              kpis.profit
            )}
            description="Net profit after costs"
          />

          <KPICard
            icon={<ShoppingCart size={22} />}
            title="Total Orders"
            value={kpis.orders.toLocaleString()}
            description="Number of unique orders"
          />

          <KPICard
            icon={<Users size={22} />}
            title="Customers"
            value={kpis.customers.toLocaleString()}
            description="Unique customer count"
          />

        </section>


        {/* AI COPILOT */}

        <section className="new-copilot">

          <div className="new-copilot-icon">
            <Sparkles size={28} />
          </div>

          <div className="new-copilot-text">

            <span>
              AI ANALYTICS COPILOT
            </span>

            <h2>
              Ask your data anything.
            </h2>

            <p>
              Turn business questions into instant
              insights using natural language.
            </p>

          </div>

          <Link
            to="/query"
            className="new-copilot-button"
          >
            <Sparkles size={18} />
            Ask a Question
          </Link>

        </section>


        {/* CHART ROW */}

        <section className="dashboard-chart-grid">


          {/* REGION */}

          <div className="new-chart-card">

            <div className="new-chart-header">

              <div className="chart-heading-icon">
                <BarChart3 size={20} />
              </div>

              <div>

                <h3>
                  Revenue by Region
                </h3>

                <p>
                  Regional performance
                </p>

              </div>

            </div>


            <div className="new-chart-body">

              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <BarChart
                  data={regionData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.15}
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
                    fill="var(--primary)"
                    radius={[
                      8,
                      8,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>


          {/* CATEGORY */}

          <div className="new-chart-card">

            <div className="new-chart-header">

              <div className="chart-heading-icon">
                <PieChart size={20} />
              </div>

              <div>

                <h3>
                  Revenue Distribution
                </h3>

                <p>
                  Revenue by category
                </p>

              </div>

            </div>


            <div className="new-chart-body">

              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <RechartsPieChart>

                  <Pie
                    data={categoryData}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    innerRadius={55}
                    paddingAngle={4}
                  >

                    {categoryData.map(
                      (_, index) => (

                        <Cell
                          key={`category-${index}`}
                          fill={
                            [
                              '#3155ff',
                              '#7c3aed',
                              '#06b6d4',
                              '#10b981',
                              '#f59e0b',
                            ][index % 5]
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


        {/* TREND */}

        <section className="new-chart-card trend-card">

          <div className="new-chart-header">

            <div className="chart-heading-icon">
              <TrendingUp size={20} />
            </div>

            <div>

              <h3>
                Revenue Trend
              </h3>

              <p>
                Track your business performance over time
              </p>

            </div>

          </div>


          <div className="new-chart-body">

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
                  opacity={0.15}
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
                  stroke="var(--primary)"
                  strokeWidth={4}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </section>


        {/* QUICK ACTIONS */}

        <section className="dashboard-actions">

          <Link
            to="/query"
            className="dashboard-action"
          >

            <div className="action-icon">
              <Sparkles size={21} />
            </div>

            <div>
              <strong>
                Ask MetricMind
              </strong>

              <span>
                Query your business data
              </span>
            </div>

            <ArrowUpRight size={18} />

          </Link>


          <Link
            to="/dataset"
            className="dashboard-action"
          >

            <div className="action-icon">
              <Upload size={21} />
            </div>

            <div>
              <strong>
                Manage Dataset
              </strong>

              <span>
                Upload or activate your data
              </span>
            </div>

            <ArrowUpRight size={18} />

          </Link>


          <div className="dashboard-action">

            <div className="action-icon">
              <Database size={21} />
            </div>

            <div>
              <strong>
                Data Connection
              </strong>

              <span>
                {backendOnline
                  ? 'Backend connected'
                  : 'Backend unavailable'}
              </span>
            </div>

          </div>

        </section>

      </main>


      {/* FOOTER */}

      <footer className="new-dashboard-footer">

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