import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Database,
  Moon,
  PieChart,
  RefreshCw,
  Sparkles,
  Sun,
  Users,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react'
import { apiService } from '../services/api'
import './Dashboard.css'

function formatCurrency(value) {
  const number = Number(value || 0)

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(number)
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0))
}

function getValue(data, keys, fallback = 0) {
  if (!data || typeof data !== 'object') return fallback

  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) {
      return data[key]
    }
  }

  return fallback
}

function Card({ icon: Icon, title, value, description }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className="kpi-icon">
          <Icon size={22} />
        </div>

        <span className="kpi-live">
          <span className="live-dot"></span>
          Live
        </span>
      </div>

      <div className="kpi-title">{title}</div>

      <div className="kpi-value">{value}</div>

      <div className="kpi-description">
        {description}
      </div>

      <div className="kpi-footer">
        <TrendingUp size={15} />
        Updated from live data
      </div>
    </div>
  )
}

function EmptyChart({ icon: Icon, title, message }) {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <div className="chart-icon">
            <Icon size={20} />
          </div>
          <h3>{title}</h3>
        </div>
      </div>

      <div className="empty-chart">
        <BarChart3 size={42} />
        <strong>Awaiting data</strong>
        <span>{message}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('metricmind_theme') === 'dark'
  )

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [online, setOnline] = useState(false)

  const [kpis, setKpis] = useState({})
  const [regionData, setRegionData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [topProducts, setTopProducts] = useState([])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)

    localStorage.setItem(
      'metricmind_theme',
      darkMode ? 'dark' : 'light'
    )
  }, [darkMode])

  const loadDashboard = async () => {
    try {
      setError('')

      const healthResponse = await apiService.health()

      if (healthResponse?.data) {
        setOnline(true)
      }

      const [
        kpiResponse,
        regionResponse,
        categoryResponse,
        productResponse,
      ] = await Promise.allSettled([
        apiService.getDashboardKPIs(),
        apiService.getSalesByRegion(),
        apiService.getSalesByCategory(),
        apiService.getTopProducts(10),
      ])

      if (kpiResponse.status === 'fulfilled') {
        setKpis(kpiResponse.value?.data || {})
      }

      if (regionResponse.status === 'fulfilled') {
        const data = regionResponse.value?.data

        setRegionData(
          Array.isArray(data)
            ? data
            : data?.data || data?.results || data?.regions || []
        )
      }

      if (categoryResponse.status === 'fulfilled') {
        const data = categoryResponse.value?.data

        setCategoryData(
          Array.isArray(data)
            ? data
            : data?.data || data?.results || data?.categories || []
        )
      }

      if (productResponse.status === 'fulfilled') {
        const data = productResponse.value?.data

        setTopProducts(
          Array.isArray(data)
            ? data
            : data?.data || data?.results || data?.products || []
        )
      }
    } catch (err) {
      console.error('Dashboard error:', err)
      setOnline(false)
      setError(
        'Unable to connect to the MetricMind backend on port 8001.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const refreshDashboard = async () => {
    setRefreshing(true)
    await loadDashboard()
  }

  const revenue = getValue(
    kpis,
    ['total_revenue', 'revenue', 'total_sales', 'sales']
  )

  const profit = getValue(
    kpis,
    ['total_profit', 'profit']
  )

  const orders = getValue(
    kpis,
    ['total_orders', 'orders', 'order_count']
  )

  const customers = getValue(
    kpis,
    ['total_customers', 'customers', 'customer_count']
  )

  const maxRegionValue = useMemo(() => {
    if (!regionData.length) return 1

    return Math.max(
      ...regionData.map((item) =>
        Number(
          getValue(
            item,
            ['revenue', 'sales', 'total_revenue', 'value']
          )
        )
      ),
      1
    )
  }, [regionData])

  const maxProductValue = useMemo(() => {
    if (!topProducts.length) return 1

    return Math.max(
      ...topProducts.map((item) =>
        Number(
          getValue(
            item,
            ['revenue', 'sales', 'total_sales', 'value']
          )
        )
      ),
      1
    )
  }, [topProducts])

  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <header className="dashboard-header">
        <div className="brand-area">
          <div className="brand-logo">
            <BrainCircuit size={30} />
          </div>

          <div>
            <h1>Metric<span>Mind</span></h1>
            <p>Business Intelligence</p>
          </div>
        </div>

        <div className="header-actions">
          <div className={`api-status ${online ? 'online' : 'offline'}`}>
            <span className="status-dot"></span>
            API {online ? 'Online' : 'Offline'}
          </div>

          <button
            className="icon-button"
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle dark mode"
          >
            {darkMode ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}
          </button>

          <button
            className="icon-button"
            onClick={refreshDashboard}
            disabled={refreshing}
            title="Refresh dashboard"
          >
            <RefreshCw
              size={20}
              className={refreshing ? 'spin' : ''}
            />
          </button>

          <Link to="/query" className="ask-button">
            <Sparkles size={18} />
            Ask a Question
            <ArrowRight size={17} />
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">
            METRICMIND INTELLIGENCE
          </div>

          <h2>
            Good morning,
            <br />
            <span>there.</span>
          </h2>

          <p>
            A live pulse check of your MetricMind workspace.
          </p>
        </div>

        <div className="hero-badge">
          <Activity size={18} />
          Real-time analytics
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="dashboard-error">
          <Activity size={19} />
          <span>{error}</span>

          <button onClick={refreshDashboard}>
            Try Again
          </button>
        </div>
      )}

      {/* KPI CARDS */}
      <section className="kpi-grid">
        <Card
          icon={TrendingUp}
          title="Total Revenue"
          value={
            loading
              ? '—'
              : formatCurrency(revenue)
          }
          description="Revenue from all transactions"
        />

        <Card
          icon={Activity}
          title="Total Profit"
          value={
            loading
              ? '—'
              : formatCurrency(profit)
          }
          description="Net profit after costs"
        />

        <Card
          icon={ShoppingCart}
          title="Total Orders"
          value={
            loading
              ? '—'
              : formatNumber(orders)
          }
          description="Number of unique orders"
        />

        <Card
          icon={Users}
          title="Customers"
          value={
            loading
              ? '—'
              : formatNumber(customers)
          }
          description="Unique customer count"
        />
      </section>

      {/* AI COPILOT */}
      <section className="copilot-card">
        <div className="copilot-icon">
          <Sparkles size={25} />
        </div>

        <div className="copilot-content">
          <div className="eyebrow">
            YOUR ANALYTICS COPILOT
          </div>

          <h3>
            Turn a business question into a
            confident next move.
          </h3>

          <p>
            Ask questions about your business data
            using natural language.
          </p>
        </div>

        <Link to="/query" className="copilot-button">
          Ask a Question
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* CHARTS */}
      <section className="analytics-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">SALES PERFORMANCE</div>
            <h2>Business performance at a glance</h2>
          </div>

          <Link to="/analytics">
            View Analytics
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="charts-grid">

          {/* REGION */}
          {regionData.length > 0 ? (
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title">
                  <div className="chart-icon">
                    <BarChart3 size={20} />
                  </div>
                  <h3>Revenue by Region</h3>
                </div>
              </div>

              <div className="bars">
                {regionData.slice(0, 6).map((item, index) => {
                  const name = getValue(
                    item,
                    ['region', 'name', 'label'],
                    `Region ${index + 1}`
                  )

                  const value = Number(
                    getValue(
                      item,
                      ['revenue', 'sales', 'total_revenue', 'value']
                    )
                  )

                  const width =
                    Math.max(
                      5,
                      (value / maxRegionValue) * 100
                    )

                  return (
                    <div className="bar-row" key={index}>
                      <div className="bar-label">
                        <span>{name}</span>
                        <strong>
                          {formatCurrency(value)}
                        </strong>
                      </div>

                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <EmptyChart
              icon={BarChart3}
              title="Revenue by Region"
              message="Upload and activate your dataset to display regional analytics."
            />
          )}

          {/* CATEGORY */}
          {categoryData.length > 0 ? (
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title">
                  <div className="chart-icon">
                    <PieChart size={20} />
                  </div>
                  <h3>Revenue by Category</h3>
                </div>
              </div>

              <div className="category-list">
                {categoryData.slice(0, 6).map((item, index) => {
                  const name = getValue(
                    item,
                    ['category', 'name', 'label'],
                    `Category ${index + 1}`
                  )

                  const value = Number(
                    getValue(
                      item,
                      ['revenue', 'sales', 'total_revenue', 'value']
                    )
                  )

                  return (
                    <div className="category-item" key={index}>
                      <div className="category-left">
                        <span className="category-number">
                          {index + 1}
                        </span>

                        <span>{name}</span>
                      </div>

                      <strong>
                        {formatCurrency(value)}
                      </strong>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <EmptyChart
              icon={PieChart}
              title="Revenue by Category"
              message="Upload and activate your dataset to display category analytics."
            />
          )}

        </div>
      </section>

      {/* PRODUCTS */}
      <section className="products-section">

        {topProducts.length > 0 ? (
          <div className="chart-card full-width">
            <div className="chart-header">
              <div className="chart-title">
                <div className="chart-icon">
                  <Database size={20} />
                </div>

                <h3>Top 10 Products</h3>
              </div>
            </div>

            <div className="bars">
              {topProducts.slice(0, 10).map((item, index) => {
                const name = getValue(
                  item,
                  ['product_name', 'product', 'name', 'label'],
                  `Product ${index + 1}`
                )

                const value = Number(
                  getValue(
                    item,
                    ['revenue', 'sales', 'total_sales', 'value']
                  )
                )

                const width =
                  Math.max(
                    5,
                    (value / maxProductValue) * 100
                  )

                return (
                  <div className="bar-row" key={index}>
                    <div className="bar-label">
                      <span>
                        {index + 1}. {name}
                      </span>

                      <strong>
                        {formatCurrency(value)}
                      </strong>
                    </div>

                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <EmptyChart
            icon={Database}
            title="Top 10 Products"
            message="Upload and activate your dataset to display product analytics."
          />
        )}

      </section>

    </div>
  )
}