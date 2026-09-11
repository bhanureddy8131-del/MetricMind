import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bot,
  Database,
  Moon,
  RefreshCw,
  Sun,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'
import './Dashboard.css'

function formatNumber(value) {
  const number = Number(value || 0)

  return number.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })
}

function formatCurrency(value) {
  const number = Number(value || 0)

  return '$' + number.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  })
}

function extractValue(result) {
  if (!result) {
    return 0
  }

  if (typeof result === 'number') {
    return result
  }

  if (typeof result === 'string') {
    const number = Number(result.replace(/[^0-9.-]/g, ''))
    return Number.isNaN(number) ? 0 : number
  }

  if (result.value !== undefined) {
    return extractValue(result.value)
  }

  if (result.data !== undefined) {
    return extractValue(result.data)
  }

  return 0
}

function findNumericValue(data, names) {
  if (!data || typeof data !== 'object') {
    return 0
  }

  for (const name of names) {
    if (data[name] !== undefined) {
      return extractValue(data[name])
    }
  }

  const keys = Object.keys(data)

  for (const key of keys) {
    const lower = key.toLowerCase()

    for (const name of names) {
      if (lower.includes(name.toLowerCase())) {
        return extractValue(data[key])
      }
    }
  }

  return 0
}

function normalizeRows(response) {
  if (!response) {
    return []
  }

  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response.data)) {
    return response.data
  }

  if (response.data && Array.isArray(response.data.data)) {
    return response.data.data
  }

  return []
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [online, setOnline] = useState(false)
  const [error, setError] = useState('')

  const [kpis, setKpis] = useState({
    revenue: 0,
    profit: 0,
    orders: 0,
    customers: 0,
  })

  const [regionData, setRegionData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [productData, setProductData] = useState([])

  const [darkMode, setDarkMode] = useState(function () {
    return localStorage.getItem('metricmind_theme') === 'dark'
  })

  async function askBackend(question) {
    try {
      const response = await apiService.query(question)

      if (response && response.data) {
        return response.data
      }

      return null
    } catch (requestError) {
      console.error('Query failed:', question, requestError)
      return null
    }
  }

  async function loadDashboard() {
    setError('')

    try {
      await apiService.health()
      setOnline(true)
    } catch (healthError) {
      console.error('Backend health error:', healthError)
      setOnline(false)
      setError(
        'Backend is not available. Start MetricMind backend on port 8001.'
      )
      setLoading(false)
      setRefreshing(false)
      return
    }

    try {
      const [
        revenueResponse,
        profitResponse,
        ordersResponse,
        customersResponse,
        regionResponse,
        categoryResponse,
        productResponse,
      ] = await Promise.all([
        askBackend('What is the total sales revenue?'),
        askBackend('What is the total profit?'),
        askBackend('How many unique orders are there?'),
        askBackend('How many unique customers are there?'),
        askBackend('What is total sales revenue by region?'),
        askBackend('What is total sales revenue by category?'),
        askBackend('What are the top 10 products by sales revenue?'),
      ])

      setKpis({
        revenue: findNumericValue(
          revenueResponse,
          ['sales', 'revenue', 'total_sales', 'total_revenue']
        ),
        profit: findNumericValue(
          profitResponse,
          ['profit', 'total_profit']
        ),
        orders: findNumericValue(
          ordersResponse,
          ['orders', 'order_count', 'unique_orders', 'count']
        ),
        customers: findNumericValue(
          customersResponse,
          [
            'customers',
            'customer_count',
            'unique_customers',
            'count',
          ]
        ),
      })

      setRegionData(normalizeRows(regionResponse))
      setCategoryData(normalizeRows(categoryResponse))
      setProductData(normalizeRows(productResponse))
    } catch (dashboardError) {
      console.error('Dashboard loading error:', dashboardError)

      setError(
        'Dashboard data could not be loaded. Check the backend logs.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(function () {
    loadDashboard()
  }, [])

  useEffect(
    function () {
      if (darkMode) {
        document.body.classList.add('metricmind-dark')
        localStorage.setItem('metricmind_theme', 'dark')
      } else {
        document.body.classList.remove('metricmind-dark')
        localStorage.setItem('metricmind_theme', 'light')
      }
    },
    [darkMode]
  )

  function refreshDashboard() {
    setRefreshing(true)
    loadDashboard()
  }

  function openQuery() {
    navigate('/query')
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="dashboard-logo">
            <Sparkles size={28} />
          </div>

          <div>
            <h1>MetricMind</h1>
            <p>Welcome back. Here is your business overview.</p>
          </div>
        </div>

        <div className="dashboard-actions">
          <div
            className={
              online
                ? 'api-status online'
                : 'api-status offline'
            }
          >
            <span></span>
            {online ? 'API Online' : 'API Offline'}
          </div>

          <button
            className="icon-button"
            onClick={function () {
              setDarkMode(!darkMode)
            }}
            title="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            className="refresh-button"
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            <RefreshCw
              size={18}
              className={refreshing ? 'spin' : ''}
            />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="dashboard-error">
          <Activity size={20} />
          <span>{error}</span>
        </div>
      )}

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">
            <DollarSign size={24} />
          </div>

          <div className="kpi-content">
            <span>Total Revenue</span>

            <strong>
              {loading ? 'Loading...' : formatCurrency(kpis.revenue)}
            </strong>

            <small>
              <TrendingUp size={15} />
              From live dataset
            </small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <TrendingUp size={24} />
          </div>

          <div className="kpi-content">
            <span>Total Profit</span>

            <strong>
              {loading ? 'Loading...' : formatCurrency(kpis.profit)}
            </strong>

            <small>
              <TrendingUp size={15} />
              Net profit
            </small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <ShoppingCart size={24} />
          </div>

          <div className="kpi-content">
            <span>Total Orders</span>

            <strong>
              {loading ? 'Loading...' : formatNumber(kpis.orders)}
            </strong>

            <small>
              <ShoppingCart size={15} />
              Unique orders
            </small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Users size={24} />
          </div>

          <div className="kpi-content">
            <span>Total Customers</span>

            <strong>
              {loading ? 'Loading...' : formatNumber(kpis.customers)}
            </strong>

            <small>
              <Users size={15} />
              Unique customers
            </small>
          </div>
        </div>
      </section>

      <section className="copilot-banner">
        <div className="copilot-icon">
          <Bot size={30} />
        </div>

        <div className="copilot-text">
          <span>YOUR ANALYTICS COPILOT</span>
          <h2>Turn a business question into a confident next move.</h2>
          <p>
            Ask questions about your business data using natural
            language.
          </p>
        </div>

        <button
          className="copilot-button"
          onClick={openQuery}
        >
          Ask a Question
          <ArrowUpRight size={19} />
        </button>
      </section>

      <section className="charts-section">
        <div className="section-title">
          <div>
            <span>LIVE ANALYTICS</span>
            <h2>Sales Performance</h2>
          </div>

          <Database size={24} />
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <BarChart3 size={22} />
                <h3>Revenue by Region</h3>
              </div>
            </div>

            {regionData.length === 0 ? (
              <div className="empty-chart">
                <Database size={32} />
                <strong>No region data</strong>
                <p>
                  Upload and activate your dataset, then refresh
                  the dashboard.
                </p>
              </div>
            ) : (
              <div className="bar-list">
                {regionData.slice(0, 8).map(function (item, index) {
                  const label =
                    item.region ||
                    item.Region ||
                    item.name ||
                    item.label ||
                    'Region ' + (index + 1)

                  const value = findNumericValue(
                    item,
                    ['sales', 'revenue', 'total_sales']
                  )

                  const maxValue = Math.max(
                    ...regionData.map(function (row) {
                      return findNumericValue(row, [
                        'sales',
                        'revenue',
                        'total_sales',
                      ])
                    }),
                    1
                  )

                  const width =
                    Math.max((value / maxValue) * 100, 3)

                  return (
                    <div className="bar-row" key={index}>
                      <div className="bar-label">
                        <span>{label}</span>
                        <b>{formatCurrency(value)}</b>
                      </div>

                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: width + '%' }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <Activity size={22} />
                <h3>Revenue by Category</h3>
              </div>
            </div>

            {categoryData.length === 0 ? (
              <div className="empty-chart">
                <Database size={32} />
                <strong>No category data</strong>
                <p>
                  Upload and activate your dataset, then refresh
                  the dashboard.
                </p>
              </div>
            ) : (
              <div className="bar-list">
                {categoryData
                  .slice(0, 8)
                  .map(function (item, index) {
                    const label =
                      item.category ||
                      item.Category ||
                      item.name ||
                      item.label ||
                      'Category ' + (index + 1)

                    const value = findNumericValue(
                      item,
                      ['sales', 'revenue', 'total_sales']
                    )

                    const maxValue = Math.max(
                      ...categoryData.map(function (row) {
                        return findNumericValue(row, [
                          'sales',
                          'revenue',
                          'total_sales',
                        ])
                      }),
                      1
                    )

                    const width = Math.max(
                      (value / maxValue) * 100,
                      3
                    )

                    return (
                      <div className="bar-row" key={index}>
                        <div className="bar-label">
                          <span>{label}</span>
                          <b>{formatCurrency(value)}</b>
                        </div>

                        <div className="bar-track">
                          <div
                            className="bar-fill secondary"
                            style={{
                              width: width + '%',
                            }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="products-card">
        <div className="chart-header">
          <div>
            <ShoppingCart size={22} />
            <h3>Top 10 Products</h3>
          </div>
        </div>

        {productData.length === 0 ? (
          <div className="empty-products">
            <Database size={30} />
            <strong>No product data available</strong>
            <p>
              Upload your dataset and refresh the dashboard.
            </p>
          </div>
        ) : (
          <div className="product-list">
            {productData.slice(0, 10).map(function (item, index) {
              const name =
                item.product_name ||
                item.product ||
                item.Product ||
                item.name ||
                'Product ' + (index + 1)

              const sales = findNumericValue(item, [
                'sales',
                'revenue',
                'total_sales',
              ])

              return (
                <div className="product-row" key={index}>
                  <span className="product-rank">
                    {index + 1}
                  </span>

                  <span className="product-name">{name}</span>

                  <strong>{formatCurrency(sales)}</strong>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}