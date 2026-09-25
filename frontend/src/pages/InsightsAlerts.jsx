import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  Bell,
  Brain,
  CheckCircle,
  DollarSign,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Activity,
  Target,
  Sparkles,
  Clock,
} from 'lucide-react'

import { apiService } from '../services/api'
import './InsightsAlerts.css'


// ============================================================
// HELPERS
// ============================================================

function getNumber(value) {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const number = Number(
    String(value).replace(/,/g, '')
  )

  return Number.isFinite(number) ? number : 0
}


function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(getNumber(value))
}


function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(
    getNumber(value)
  )
}


function formatPercent(value) {
  return `${getNumber(value).toFixed(1)}%`
}


function extractRows(response) {
  if (!response) {
    return []
  }

  const data = response?.data ?? response

  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  if (Array.isArray(data?.rows)) {
    return data.rows
  }

  if (Array.isArray(data?.results)) {
    return data.results
  }

  return []
}


function extractFirstNumber(response) {
  if (!response) {
    return 0
  }

  const data = response?.data ?? response

  if (typeof data === 'number') {
    return getNumber(data)
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return 0
    }

    const first = data[0]

    if (typeof first === 'number') {
      return getNumber(first)
    }

    if (first && typeof first === 'object') {
      for (const value of Object.values(first)) {
        const number = getNumber(value)

        if (
          typeof value === 'number' ||
          (
            typeof value === 'string' &&
            value.trim() !== '' &&
            Number.isFinite(Number(value))
          )
        ) {
          return number
        }
      }
    }
  }

  if (data && typeof data === 'object') {
    const preferredKeys = [
      'value',
      'revenue',
      'sales',
      'profit',
      'orders',
      'customers',
      'total',
      'amount',
    ]

    for (const key of preferredKeys) {
      if (
        data[key] !== undefined &&
        data[key] !== null
      ) {
        return getNumber(data[key])
      }
    }

    for (const value of Object.values(data)) {
      if (
        typeof value === 'number' &&
        Number.isFinite(value)
      ) {
        return value
      }

      if (
        typeof value === 'string' &&
        value.trim() !== '' &&
        Number.isFinite(Number(value))
      ) {
        return Number(value)
      }
    }
  }

  if (typeof response?.answer === 'string') {
    const match = response.answer.match(
      /-?\d[\d,]*(?:\.\d+)?/
    )

    if (match) {
      return Number(
        match[0].replace(/,/g, '')
      )
    }
  }

  return 0
}


function getRowName(row) {
  if (!row) {
    return 'Unknown'
  }

  return (
    row.region ||
    row.category ||
    row.name ||
    row.product ||
    row.product_name ||
    row.segment ||
    row.Region ||
    row.Category ||
    Object.values(row)[0] ||
    'Unknown'
  )
}


function getRowValue(row) {
  if (!row) {
    return 0
  }

  const preferredKeys = [
    'revenue',
    'sales',
    'profit',
    'value',
    'total',
    'amount',
    'total_revenue',
  ]

  for (const key of preferredKeys) {
    if (
      row[key] !== undefined &&
      row[key] !== null
    ) {
      const value = Number(row[key])

      if (Number.isFinite(value)) {
        return value
      }
    }
  }

  for (const value of Object.values(row)) {
    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return value
    }

    if (
      typeof value === 'string' &&
      value.trim() !== '' &&
      Number.isFinite(Number(value))
    ) {
      return Number(value)
    }
  }

  return 0
}


// ============================================================
// INSIGHTS & ALERTS
// ============================================================

function InsightsAlerts() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [kpis, setKpis] = useState({
    revenue: 0,
    profit: 0,
    orders: 0,
    customers: 0,
  })

  const [regionData, setRegionData] = useState([])
  const [categoryData, setCategoryData] = useState([])

  const [dismissedAlerts, setDismissedAlerts] = useState([])

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  async function loadInsights(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const [
        revenueResult,
        profitResult,
        ordersResult,
        customersResult,
        regionResult,
        categoryResult,
      ] = await Promise.all([
        apiService.query({
          question: 'What is our total revenue?',
        }),

        apiService.query({
          question: 'What is our total profit?',
        }),

        apiService.query({
          question: 'How many orders do we have?',
        }),

        apiService.query({
          question: 'How many customers do we have?',
        }),

        apiService.query({
          question: 'What is total revenue by region?',
        }),

        apiService.query({
          question: 'What is total revenue by category?',
        }),
      ])

      setKpis({
        revenue: extractFirstNumber(revenueResult),
        profit: extractFirstNumber(profitResult),
        orders: extractFirstNumber(ordersResult),
        customers: extractFirstNumber(customersResult),
      })

      setRegionData(
        extractRows(regionResult)
      )

      setCategoryData(
        extractRows(categoryResult)
      )
    } catch (err) {
      console.error(
        'Insights loading error:',
        err
      )

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to load insights from the backend.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }


  useEffect(() => {
    loadInsights()
  }, [])


  // ==========================================================
  // DERIVED METRICS
  // ==========================================================

  const profitMargin = useMemo(() => {
    if (!kpis.revenue) {
      return 0
    }

    return (
      (kpis.profit / kpis.revenue) *
      100
    )
  }, [
    kpis.revenue,
    kpis.profit,
  ])


  const averageOrderValue = useMemo(() => {
    if (!kpis.orders) {
      return 0
    }

    return kpis.revenue / kpis.orders
  }, [
    kpis.revenue,
    kpis.orders,
  ])


  const revenueByRegion = useMemo(() => {
    return regionData
      .map((row) => ({
        name: String(
          getRowName(row)
        ),
        value: getRowValue(row),
      }))
      .filter((item) => item.value > 0)
      .sort(
        (a, b) => b.value - a.value
      )
  }, [regionData])


  const revenueByCategory = useMemo(() => {
    return categoryData
      .map((row) => ({
        name: String(
          getRowName(row)
        ),
        value: getRowValue(row),
      }))
      .filter((item) => item.value > 0)
      .sort(
        (a, b) => b.value - a.value
      )
  }, [categoryData])


  // ==========================================================
  // AI INSIGHTS
  // ==========================================================

  const aiInsights = useMemo(() => {
    const insights = []

    if (kpis.revenue > 0) {
      insights.push({
        id: 'revenue-health',
        type: 'positive',
        icon: TrendingUp,
        title: 'Revenue performance',
        text: `Your dataset currently shows ${formatCurrency(
          kpis.revenue
        )} in total revenue across ${formatNumber(
          kpis.orders
        )} orders.`,
      })
    }

    if (profitMargin > 20) {
      insights.push({
        id: 'healthy-margin',
        type: 'positive',
        icon: CheckCircle,
        title: 'Healthy profit margin',
        text: `The current profit margin is ${formatPercent(
          profitMargin
        )}.`,
      })
    } else if (profitMargin > 0) {
      insights.push({
        id: 'low-margin',
        type: 'warning',
        icon: AlertTriangle,
        title: 'Profit margin needs attention',
        text: `The current profit margin is ${formatPercent(
          profitMargin
        )}. Review discounts, product costs, and low-profit orders.`,
      })
    } else if (kpis.revenue > 0) {
      insights.push({
        id: 'negative-margin',
        type: 'critical',
        icon: XCircle,
        title: 'Profit requires attention',
        text: `Revenue is ${formatCurrency(
          kpis.revenue
        )}, while reported profit is ${formatCurrency(
          kpis.profit
        )}.`,
      })
    }

    if (revenueByRegion.length > 0) {
      const topRegion =
        revenueByRegion[0]

      insights.push({
        id: 'top-region',
        type: 'info',
        icon: Activity,
        title: 'Leading region',
        text: `${topRegion.name} currently contributes ${formatCurrency(
          topRegion.value
        )} in revenue.`,
      })
    }

    if (revenueByCategory.length > 0) {
      const topCategory =
        revenueByCategory[0]

      insights.push({
        id: 'top-category',
        type: 'info',
        icon: Target,
        title: 'Leading category',
        text: `${topCategory.name} currently has the highest reported revenue at ${formatCurrency(
          topCategory.value
        )}.`,
      })
    }

    if (averageOrderValue > 0) {
      insights.push({
        id: 'average-order',
        type: 'info',
        icon: DollarSign,
        title: 'Average order value',
        text: `The average revenue per order is approximately ${formatCurrency(
          averageOrderValue
        )}.`,
      })
    }

    return insights
  }, [
    kpis,
    profitMargin,
    averageOrderValue,
    revenueByRegion,
    revenueByCategory,
  ])


  // ==========================================================
  // ALERTS
  // ==========================================================

  const alerts = useMemo(() => {
    const generatedAlerts = []

    if (
      kpis.revenue > 0 &&
      kpis.profit <= 0
    ) {
      generatedAlerts.push({
        id: 'profit-negative',
        severity: 'critical',
        icon: XCircle,
        title: 'Profit alert',
        message:
          'Reported profit is zero or negative while revenue is present.',
        value: formatCurrency(
          kpis.profit
        ),
      })
    }

    if (
      kpis.revenue > 0 &&
      profitMargin > 0 &&
      profitMargin < 10
    ) {
      generatedAlerts.push({
        id: 'low-profit-margin',
        severity: 'warning',
        icon: AlertTriangle,
        title: 'Low profit margin',
        message:
          'Profit margin is below 10%. Review pricing, discounts, and costs.',
        value: formatPercent(
          profitMargin
        ),
      })
    }

    if (
      revenueByRegion.length >= 2
    ) {
      const highest =
        revenueByRegion[0]

      const lowest =
        revenueByRegion[
          revenueByRegion.length - 1
        ]

      if (
        highest.value >
        lowest.value * 2
      ) {
        generatedAlerts.push({
          id: 'region-gap',
          severity: 'warning',
          icon: TrendingDown,
          title: 'Regional performance gap',
          message: `${highest.name} has substantially more revenue than ${lowest.name}.`,
          value: formatCurrency(
            highest.value
          ),
        })
      }
    }

    if (
      kpis.orders > 0 &&
      kpis.customers > 0
    ) {
      const ordersPerCustomer =
        kpis.orders /
        kpis.customers

      if (
        ordersPerCustomer < 1.2
      ) {
        generatedAlerts.push({
          id: 'customer-engagement',
          severity: 'info',
          icon: UsersIcon,
          title: 'Customer engagement',
          message:
            'Orders per customer are relatively low. Consider reviewing repeat-purchase opportunities.',
          value:
            ordersPerCustomer.toFixed(2),
        })
      }
    }

    if (
      generatedAlerts.length === 0 &&
      kpis.revenue > 0
    ) {
      generatedAlerts.push({
        id: 'performance-normal',
        severity: 'success',
        icon: CheckCircle,
        title: 'Performance status',
        message:
          'No major automated alerts were detected from the current dataset.',
        value: 'Healthy',
      })
    }

    return generatedAlerts
  }, [
    kpis,
    profitMargin,
    revenueByRegion,
  ])


  const visibleAlerts = alerts.filter(
    (alert) =>
      !dismissedAlerts.includes(
        alert.id
      )
  )


  // ==========================================================
  // DISMISS ALERT
  // ==========================================================

  function dismissAlert(id) {
    setDismissedAlerts(
      (previous) => [
        ...previous,
        id,
      ]
    )
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="insights-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="insights-header">

        <div className="insights-header-left">

          <button
            type="button"
            className="insights-back-button"
            onClick={() =>
              navigate('/')
            }
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

          <div className="insights-title-area">

            <div className="insights-title-icon">
              <Bell size={27} />
            </div>

            <div>

              <div className="insights-eyebrow">
                <Sparkles size={14} />
                MetricMind Intelligence
              </div>

              <h1>
                Insights & Alerts
              </h1>

              <p>
                AI-powered insights and
                business performance alerts
                from your dataset.
              </p>

            </div>

          </div>

        </div>


        <button
          type="button"
          className="insights-refresh-button"
          onClick={() =>
            loadInsights(true)
          }
          disabled={
            loading ||
            refreshing
          }
        >
          <RefreshCw
            size={18}
            className={
              refreshing
                ? 'spin'
                : ''
            }
          />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh Insights'}
        </button>

      </header>


      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="insights-error">

          <XCircle size={20} />

          <div>

            <strong>
              Unable to load live insights
            </strong>

            <span>
              {error}
            </span>

          </div>

        </div>

      )}


      {/* =====================================================
          KPI SUMMARY
      ====================================================== */}

      <section className="insights-kpis">

        <div className="insight-kpi-card">

          <div className="insight-kpi-icon revenue">
            <DollarSign size={22} />
          </div>

          <div>

            <span>
              Revenue
            </span>

            <strong>
              {loading
                ? 'Loading...'
                : formatCurrency(
                    kpis.revenue
                  )}
            </strong>

          </div>

        </div>


        <div className="insight-kpi-card">

          <div className="insight-kpi-icon profit">
            <TrendingUp size={22} />
          </div>

          <div>

            <span>
              Profit
            </span>

            <strong>
              {loading
                ? 'Loading...'
                : formatCurrency(
                    kpis.profit
                  )}
            </strong>

          </div>

        </div>


        <div className="insight-kpi-card">

          <div className="insight-kpi-icon margin">
            <Activity size={22} />
          </div>

          <div>

            <span>
              Profit Margin
            </span>

            <strong>
              {loading
                ? 'Loading...'
                : formatPercent(
                    profitMargin
                  )}
            </strong>

          </div>

        </div>


        <div className="insight-kpi-card">

          <div className="insight-kpi-icon orders">
            <Target size={22} />
          </div>

          <div>

            <span>
              Orders
            </span>

            <strong>
              {loading
                ? 'Loading...'
                : formatNumber(
                    kpis.orders
                  )}
            </strong>

          </div>

        </div>

      </section>


      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div className="insights-main-grid">

        {/* ===================================================
            AI INSIGHTS
        ==================================================== */}

        <section className="insights-card">

          <div className="insights-card-header">

            <div className="insights-section-title">

              <div className="section-icon ai">
                <Brain size={20} />
              </div>

              <div>

                <h2>
                  AI Insights
                </h2>

                <p>
                  Automatically generated
                  observations from your data.
                </p>

              </div>

            </div>

            <span className="live-badge">
              <span className="live-dot" />
              Live
            </span>

          </div>


          {loading ? (

            <div className="insights-loading">

              <RefreshCw
                size={24}
                className="spin"
              />

              <span>
                Analyzing your business data...
              </span>

            </div>

          ) : aiInsights.length === 0 ? (

            <div className="insights-empty">

              <Brain size={35} />

              <p>
                Not enough data to generate
                insights yet.
              </p>

            </div>

          ) : (

            <div className="ai-insight-list">

              {aiInsights.map(
                (insight) => {

                  const Icon =
                    insight.icon

                  return (
                    <div
                      key={
                        insight.id
                      }
                      className={`ai-insight-item ${insight.type}`}
                    >

                      <div className="ai-insight-icon">
                        <Icon size={19} />
                      </div>

                      <div className="ai-insight-content">

                        <strong>
                          {insight.title}
                        </strong>

                        <p>
                          {insight.text}
                        </p>

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          )}

        </section>


        {/* ===================================================
            ALERTS
        ==================================================== */}

        <section className="insights-card">

          <div className="insights-card-header">

            <div className="insights-section-title">

              <div className="section-icon alert">
                <Bell size={20} />
              </div>

              <div>

                <h2>
                  Business Alerts
                </h2>

                <p>
                  Important conditions detected
                  in your business data.
                </p>

              </div>

            </div>

            <span className="alert-count">
              {visibleAlerts.length}
            </span>

          </div>


          {loading ? (

            <div className="insights-loading">

              <RefreshCw
                size={24}
                className="spin"
              />

              <span>
                Checking performance alerts...
              </span>

            </div>

          ) : visibleAlerts.length === 0 ? (

            <div className="all-clear">

              <CheckCircle size={38} />

              <strong>
                All clear
              </strong>

              <p>
                No active alerts currently
                require your attention.
              </p>

            </div>

          ) : (

            <div className="alert-list">

              {visibleAlerts.map(
                (alert) => {

                  const Icon =
                    alert.icon

                  return (
                    <div
                      key={
                        alert.id
                      }
                      className={`alert-item ${alert.severity}`}
                    >

                      <div className="alert-icon">
                        <Icon size={20} />
                      </div>

                      <div className="alert-content">

                        <div className="alert-title-row">

                          <strong>
                            {alert.title}
                          </strong>

                          <span className="severity-badge">
                            {alert.severity}
                          </span>

                        </div>

                        <p>
                          {alert.message}
                        </p>

                        <span className="alert-value">
                          {alert.value}
                        </span>

                      </div>

                      <button
                        type="button"
                        className="dismiss-alert"
                        onClick={() =>
                          dismissAlert(
                            alert.id
                          )
                        }
                        title="Dismiss alert"
                      >
                        <XCircle size={18} />
                      </button>

                    </div>
                  )
                }
              )}

            </div>

          )}

        </section>

      </div>


      {/* =====================================================
          PERFORMANCE SECTIONS
      ====================================================== */}

      <div className="performance-grid">

        {/* ===================================================
            REVENUE ALERTS
        ==================================================== */}

        <section className="performance-card">

          <div className="performance-card-header">

            <div className="performance-icon revenue">
              <DollarSign size={21} />
            </div>

            <div>

              <h3>
                Revenue Alerts
              </h3>

              <p>
                Revenue-related monitoring
              </p>

            </div>

          </div>


          <div className="performance-body">

            <div className="performance-value">
              {formatCurrency(
                kpis.revenue
              )}
            </div>

            <div className="performance-status positive">

              <TrendingUp size={16} />

              Revenue available

            </div>

            <p>
              MetricMind is monitoring
              revenue performance from
              the active dataset.
            </p>

          </div>

        </section>


        {/* ===================================================
            PROFIT ALERTS
        ==================================================== */}

        <section className="performance-card">

          <div className="performance-card-header">

            <div className="performance-icon profit">
              <TrendingUp size={21} />
            </div>

            <div>

              <h3>
                Profit Alerts
              </h3>

              <p>
                Profitability monitoring
              </p>

            </div>

          </div>


          <div className="performance-body">

            <div className="performance-value">
              {formatCurrency(
                kpis.profit
              )}
            </div>

            <div
              className={`performance-status ${
                profitMargin < 10
                  ? 'warning'
                  : 'positive'
              }`}
            >

              {profitMargin < 10 ? (
                <AlertTriangle
                  size={16}
                />
              ) : (
                <CheckCircle
                  size={16}
                />
              )}

              Margin{' '}
              {formatPercent(
                profitMargin
              )}

            </div>

            <p>
              Profit margin is calculated
              from current revenue and
              profit values.
            </p>

          </div>

        </section>


        {/* ===================================================
            PERFORMANCE ALERTS
        ==================================================== */}

        <section className="performance-card">

          <div className="performance-card-header">

            <div className="performance-icon performance">
              <Activity size={21} />
            </div>

            <div>

              <h3>
                Performance Alerts
              </h3>

              <p>
                Overall business activity
              </p>

            </div>

          </div>


          <div className="performance-body">

            <div className="performance-metrics">

              <div>

                <span>
                  Orders
                </span>

                <strong>
                  {formatNumber(
                    kpis.orders
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Customers
                </span>

                <strong>
                  {formatNumber(
                    kpis.customers
                  )}
                </strong>

              </div>

            </div>

            <div className="performance-status positive">

              <CheckCircle size={16} />

              Monitoring active

            </div>

            <p>
              Activity metrics are being
              monitored against the current
              dataset.
            </p>

          </div>

        </section>

      </div>


      {/* =====================================================
          DATA SNAPSHOT
      ====================================================== */}

      <section className="snapshot-card">

        <div className="snapshot-header">

          <div>

            <div className="snapshot-title">

              <Clock size={19} />

              Data Snapshot

            </div>

            <p>
              Current dataset signals used
              to generate these insights.
            </p>

          </div>

          <span className="snapshot-badge">
            Current Dataset
          </span>

        </div>


        <div className="snapshot-grid">

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
              Orders / Customer
            </span>

            <strong>
              {kpis.customers
                ? (
                    kpis.orders /
                    kpis.customers
                  ).toFixed(2)
                : '0.00'}
            </strong>

          </div>


          <div>

            <span>
              Leading Region
            </span>

            <strong>
              {revenueByRegion[0]?.name ||
                'No data'}
            </strong>

          </div>


          <div>

            <span>
              Leading Category
            </span>

            <strong>
              {revenueByCategory[0]?.name ||
                'No data'}
            </strong>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER ACTIONS
      ====================================================== */}

      <section className="insights-actions">

        <div>

          <Sparkles size={20} />

          <div>

            <strong>
              Want deeper analysis?
            </strong>

            <span>
              Ask MetricMind AI about any
              business metric.
            </span>

          </div>

        </div>

        <button
          type="button"
          onClick={() =>
            navigate('/ai-query')
          }
        >
          Open AI Copilot
          <ArrowLeft
            size={17}
            style={{
              transform:
                'rotate(180deg)',
            }}
          />
        </button>

      </section>

    </div>
  )
}


// ============================================================
// SMALL ICON HELPER
// ============================================================

function UsersIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}


export default InsightsAlerts