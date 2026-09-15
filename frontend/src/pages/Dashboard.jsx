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

function getNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(getNumber(value))
}

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

function KPI({ icon, title, value, description }) {
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

  const [regionData, setRegionData] = useState(fallbackRegion)
  const [categoryData, setCategoryData] = useState(fallbackCategory)
  const [trendData, setTrendData] = useState(fallbackTrend)

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      await apiService.health()

      setBackendOnline(true)

      const requests = await Promise.allSettled([
        apiService.getDashboardKPIs(),
        apiService.getSalesByRegion(),
        apiService.getSalesByCategory(),
        apiService.getSalesTrend('month'),
      ])

      const [kpiResult, regionResult, categoryResult, trendResult] =
        requests

      if (kpiResult.status === 'fulfilled') {
        const data = kpiResult.value.data || {}

        setKpis({
          revenue: getNumber(
            data.total_revenue ??
              data.revenue ??
              data.sales
          ),
          profit: getNumber(
            data.total_profit ??
              data.profit
          ),
          orders: getNumber(
            data.total_orders ??
              data.orders
          ),
          customers: getNumber(
            data.total_customers ??
              data.customers
          ),
        })
      }

      if (regionResult.status === 'fulfilled') {
        const raw =
          regionResult.value.data?.data ||
          regionResult.value.data?.regions ||
          regionResult.value.data ||
          []

        if (Array.isArray(raw) && raw.length) {
          setRegionData(
            raw.map((item) => ({
              region:
                item.region ||
                item.name ||
                item.Region ||
                'Unknown',
              revenue: getNumber(
                item.revenue ??
                  item.sales ??
                  item.total_revenue
              ),
            }))
          )
        }
      }

      if (categoryResult.status === 'fulfilled') {
        const raw =
          categoryResult.value.data?.data ||
          categoryResult.value.data?.categories ||
          categoryResult.value.data ||
          []

        if (Array.isArray(raw) && raw.length) {
          setCategoryData(
            raw.map((item) => ({
              category:
                item.category ||
                item.name ||
                item.Category ||
                'Unknown',
              revenue: getNumber(
                item.revenue ??
                  item.sales ??
                  item.total_revenue
              ),
            }))
          )
        }
      }

      if (trendResult.status === 'fulfilled') {
        const raw =
          trendResult.value.data?.data ||
          trendResult.value.data?.trend ||
          trendResult.value.data ||
          []

        if (Array.isArray(raw) && raw.length) {
          setTrendData(
            raw.map((item) => ({
              period:
                item.period ||
                item.month ||
                item.date ||
                item.year ||
                'Period',
              revenue: getNumber(
                item.revenue ??
                  item.sales ??
                  item.total_revenue
              ),
            }))
          )
        }
      }
    } catch (err) {
      console.error('Dashboard error:', err)

      setBackendOnline(false)
      setError(
        err.message ||
          'Backend is not available. Start MetricMind backend on port 8001.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  return (
    <div className="dashboard-page">

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
            {backendOnline ? 'API Online' : 'API Offline'}
          </div>

          <button
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
            className="refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            <RefreshCw
              size={18}
              className={loading ? 'spin' : ''}
            />
            Refresh
          </button>

          <Link to="/dataset" className="upload-button">
            <Upload size={18} />
            Upload Dataset
          </Link>

        </div>
      </header>

      <main className="dashboard-main">

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
              A live pulse check of your business
              performance.
            </p>
          </div>

          <div className="hero-badge">
            <Activity size={18} />
            Live analytics
          </div>

        </section>

        {error && (
          <div className="error-banner">
            <Database size={20} />
            <div>
              <strong>Backend connection problem</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <section className="kpi-grid">

          <KPI
            icon={<TrendingUp />}
            title="Total Revenue"
            value={formatCurrency(kpis.revenue)}
            description="Revenue from all transactions"
          />

          <KPI
            icon={<Activity />}
            title="Total Profit"
            value={formatCurrency(kpis.profit)}
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

        <section className="copilot-card">

          <div className="copilot-icon">
            <Sparkles size={28} />
          </div>

          <div className="copilot-content">
            <span>YOUR ANALYTICS COPILOT</span>
            <h2>
              Turn your business data into clear decisions.
            </h2>
            <p>
              Ask questions about your dataset using
              natural language.
            </p>
          </div>

          <Link to="/query" className="copilot-button">
            Ask a Question
            <TrendingUp size={18} />
          </Link>

        </section>

        <section className="charts-grid">

          <div className="chart-card">

            <div className="chart-header">
              <div className="chart-title">
                <BarChart3 size={22} />
                <div>
                  <h3>Revenue by Region</h3>
                  <p>Compare revenue across regions</p>
                </div>
              </div>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height={330}>
                <BarChart data={regionData}>
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
                    radius={[8, 8, 0, 0]}
                    fill="#3155ff"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          <div className="chart-card">

            <div className="chart-header">
              <div className="chart-title">
                <PieChart size={22} />
                <div>
                  <h3>Revenue Distribution</h3>
                  <p>Revenue share by category</p>
                </div>
              </div>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height={330}>
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

        <section className="chart-card full-chart">

          <div className="chart-header">
            <div className="chart-title">
              <TrendingUp size={22} />

              <div>
                <h3>Revenue Trend</h3>
                <p>
                  Track revenue performance over time
                </p>
              </div>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData}>

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

      </main>

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