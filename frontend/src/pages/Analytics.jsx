import { useEffect, useState } from 'react'
import {
  BarChart3,
  Filter,
  RefreshCcw,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  MessageSquare,
  Loader2,
} from 'lucide-react'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

import { apiService } from '../services/api'
import './Analytics.css'

const COLORS = ['#3155ff', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b']

export default function Analytics() {
  const [metric, setMetric] = useState('Revenue')
  const [region, setRegion] = useState('All regions')
  const [category, setCategory] = useState('All categories')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [kpis, setKpis] = useState({
    revenue: null,
    profit: null,
    orders: null,
    customers: null,
  })

  const [trendData, setTrendData] = useState([])
  const [regionData, setRegionData] = useState([])
  const [categoryData, setCategoryData] = useState([])

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') {
      return '—'
    }

    const number = Number(value)

    if (Number.isNaN(number)) {
      return '—'
    }

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(number)
  }

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') {
      return '—'
    }

    const number = Number(value)

    if (Number.isNaN(number)) {
      return '—'
    }

    return new Intl.NumberFormat('en-IN').format(number)
  }

  const extractRows = (response) => {
    const data = response?.data

    if (Array.isArray(data)) {
      return data
    }

    if (Array.isArray(data?.data)) {
      return data.data
    }

    if (Array.isArray(data?.rows)) {
      return data.rows
    }

    if (Array.isArray(data?.result)) {
      return data.result
    }

    return []
  }

  const runAnalyticsQuery = async (question) => {
    const response = await apiService.query({
      question,
    })

    return extractRows(response)
  }

  const loadAnalytics = async () => {
    setLoading(true)
    setError('')

    try {
      const [
        revenueResponse,
        profitResponse,
        ordersResponse,
        customersResponse,
        trendResponse,
        regionResponse,
        categoryResponse,
      ] = await Promise.all([
        apiService.query({
          question: 'What is the total revenue?',
        }),
        apiService.query({
          question: 'What is the total profit?',
        }),
        apiService.query({
          question: 'How many orders are there?',
        }),
        apiService.query({
          question: 'How many customers are there?',
        }),
        apiService.query({
          question: 'Show monthly revenue trend',
        }),
        apiService.query({
          question: 'Show revenue by region',
        }),
        apiService.query({
          question: 'Show revenue by category',
        }),
      ])

      const getAnswerNumber = (response) => {
        const answer = response?.data?.answer

        if (typeof answer === 'number') {
          return answer
        }

        const rows = extractRows(response)

        if (rows.length > 0) {
          const firstRow = rows[0]
          const firstValue = Object.values(firstRow || {})[0]

          if (firstValue !== undefined) {
            const parsed = Number(firstValue)

            if (!Number.isNaN(parsed)) {
              return parsed
            }
          }
        }

        return null
      }

      setKpis({
        revenue: getAnswerNumber(revenueResponse),
        profit: getAnswerNumber(profitResponse),
        orders: getAnswerNumber(ordersResponse),
        customers: getAnswerNumber(customersResponse),
      })

      setTrendData(
        extractRows(trendResponse).map((row) => ({
          name:
            row.month ||
            row.Month ||
            row.period ||
            row.date ||
            row.order_date ||
            Object.values(row)[0] ||
            '',
          value:
            Number(
              row.revenue ??
                row.Revenue ??
                row.sales ??
                row.Sales ??
                Object.values(row)[1] ??
                0
            ),
        }))
      )

      setRegionData(
        extractRows(regionResponse).map((row) => ({
          name:
            row.region ||
            row.Region ||
            row.name ||
            Object.values(row)[0] ||
            'Unknown',
          value:
            Number(
              row.revenue ??
                row.Revenue ??
                row.sales ??
                row.Sales ??
                Object.values(row)[1] ??
                0
            ),
        }))
      )

      setCategoryData(
        extractRows(categoryResponse).map((row) => ({
          name:
            row.category ||
            row.Category ||
            row.name ||
            Object.values(row)[0] ||
            'Unknown',
          value:
            Number(
              row.revenue ??
                row.Revenue ??
                row.sales ??
                row.Sales ??
                Object.values(row)[1] ??
                0
            ),
        }))
      )
    } catch (err) {
      console.error('Analytics loading error:', err)

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Unable to load analytics data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const metricValue =
    metric === 'Revenue'
      ? kpis.revenue
      : metric === 'Profit'
        ? kpis.profit
        : kpis.orders

  const metricDisplay =
    metric === 'Quantity'
      ? formatNumber(metricValue)
      : formatCurrency(metricValue)

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <p className="analytics-eyebrow">ANALYTICS</p>

          <h1>Explore your business performance.</h1>

          <p className="analytics-subtitle">
            Turn your MetricMind data into clear, decision-ready insights.
          </p>
        </div>

        <button
          className="analytics-refresh-button"
          onClick={loadAnalytics}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={17} className="spin" />
          ) : (
            <RefreshCcw size={17} />
          )}

          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="analytics-alert">
          <BarChart3 size={18} />

          <div>
            <strong>Analytics data unavailable</strong>

            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="analytics-filter-bar">
        <div className="filter-title">
          <Filter size={17} />

          <span>Filters</span>
        </div>

        <select
          value={metric}
          onChange={(event) => setMetric(event.target.value)}
        >
          <option>Revenue</option>
          <option>Profit</option>
          <option>Quantity</option>
        </select>

        <select
          value={region}
          onChange={(event) => setRegion(event.target.value)}
        >
          <option>All regions</option>
          <option>West</option>
          <option>East</option>
          <option>Central</option>
          <option>South</option>
        </select>

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option>All categories</option>
          <option>Technology</option>
          <option>Furniture</option>
          <option>Office Supplies</option>
        </select>

        <span className="filter-note">
          {region === 'All regions' && category === 'All categories'
            ? 'Showing all available data'
            : 'Filter selection ready for analysis'}
        </span>
      </div>

      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-card primary">
          <div className="kpi-icon">
            <DollarSign size={20} />
          </div>

          <div>
            <span>Total {metric}</span>

            <strong>{metricDisplay}</strong>

            <small>Current dataset</small>
          </div>

          <ArrowUpRight className="kpi-arrow" size={18} />
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-icon">
            <TrendingUp size={20} />
          </div>

          <div>
            <span>Total profit</span>

            <strong>{formatCurrency(kpis.profit)}</strong>

            <small>Across all records</small>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-icon">
            <ShoppingCart size={20} />
          </div>

          <div>
            <span>Total orders</span>

            <strong>{formatNumber(kpis.orders)}</strong>

            <small>Distinct orders</small>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-icon">
            <Users size={20} />
          </div>

          <div>
            <span>Total customers</span>

            <strong>{formatNumber(kpis.customers)}</strong>

            <small>Distinct customers</small>
          </div>
        </div>
      </div>

      <div className="analytics-section-grid">
        <section className="analytics-panel analytics-panel-large">
          <div className="analytics-panel-heading">
            <div>
              <p>PERFORMANCE</p>
              <h2>Revenue over time</h2>
            </div>

            <span className="chart-badge">
              <TrendingUp size={14} />
              Monthly
            </span>
          </div>

          <div className="analytics-chart">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(value),
                      'Revenue',
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3155ff"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <TrendingUp size={30} />
                <strong>No trend data available</strong>
                <span>
                  Upload or activate a dataset to see the revenue trend.
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <p>REGIONS</p>
              <h2>Performance by region</h2>
            </div>
          </div>

          <div className="analytics-chart">
            {regionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(value),
                      'Revenue',
                    ]}
                  />

                  <Bar
                    dataKey="value"
                    fill="#3155ff"
                    radius={[7, 7, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <BarChart3 size={30} />
                <strong>No regional data available</strong>
                <span>Run a query after activating a dataset.</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="analytics-section-grid">
        <section className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <p>CATEGORIES</p>
              <h2>Category mix</h2>
            </div>
          </div>

          <div className="analytics-chart">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    innerRadius={55}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`category-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(value),
                      'Revenue',
                    ]}
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <Package size={30} />
                <strong>No category data available</strong>
                <span>
                  Category analysis will appear here once data is available.
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="analytics-panel analytics-insight-panel">
          <div className="analytics-panel-heading">
            <div>
              <p>AI INSIGHTS</p>
              <h2>Ask MetricMind</h2>
            </div>
          </div>

          <div className="insight-content">
            <div className="insight-icon">
              <MessageSquare size={22} />
            </div>

            <h3>Need a deeper explanation?</h3>

            <p>
              Ask MetricMind questions about revenue, profit, products,
              regions, categories, customers, or trends.
            </p>

            <a href="/ai-query" className="analytics-ai-button">
              <MessageSquare size={16} />
              Open AI Query
            </a>
          </div>
        </section>
      </div>

      <div className="analytics-footer-card">
        <div>
          <Package size={20} />

          <div>
            <strong>Governed analytics</strong>

            <span>
              All charts are generated from MetricMind query results and
              your active dataset.
            </span>
          </div>
        </div>

        <button
          className="analytics-footer-refresh"
          onClick={loadAnalytics}
          disabled={loading}
        >
          <RefreshCcw size={15} />
          Refresh data
        </button>
      </div>
    </div>
  )
}