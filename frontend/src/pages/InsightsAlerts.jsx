import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  DollarSign,
  Activity,
  BarChart3,
  Target,
} from 'lucide-react'

import { apiService } from '../services/api'
import './InsightsAlerts.css'

function InsightsAlerts() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [insights, setInsights] = useState([])
  const [revenueAlerts, setRevenueAlerts] = useState([])
  const [profitAlerts, setProfitAlerts] = useState([])
  const [performanceAlerts, setPerformanceAlerts] = useState([])

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

  function getRows(response) {
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

  function getFirstNumericValue(row) {
    if (!row || typeof row !== 'object') {
      return 0
    }

    const preferredKeys = [
      'revenue',
      'sales',
      'profit',
      'total_revenue',
      'total_sales',
      'total_profit',
      'value',
      'amount',
    ]

    for (const key of preferredKeys) {
      if (
        row[key] !== undefined &&
        row[key] !== null
      ) {
        const value = getNumber(row[key])

        if (value !== 0) {
          return value
        }
      }
    }

    for (const value of Object.values(row)) {
      const number = getNumber(value)

      if (number !== 0) {
        return number
      }
    }

    return 0
  }

  function getFirstTextValue(row) {
    if (!row || typeof row !== 'object') {
      return 'Unknown'
    }

    const preferredKeys = [
      'region',
      'category',
      'segment',
      'product',
      'product_name',
      'name',
      'state',
      'city',
    ]

    for (const key of preferredKeys) {
      if (
        row[key] !== undefined &&
        row[key] !== null &&
        String(row[key]).trim() !== ''
      ) {
        return String(row[key])
      }
    }

    for (const value of Object.values(row)) {
      if (
        typeof value === 'string' &&
        value.trim() !== ''
      ) {
        return value
      }
    }

    return 'Unknown'
  }

  // ============================================================
  // CREATE INSIGHTS
  // ============================================================

  function buildInsights(
    revenue,
    profit,
    orders,
    customers,
    regionRows,
    categoryRows,
    productRows
  ) {
    const generatedInsights = []

    const averageOrderValue =
      orders > 0
        ? revenue / orders
        : 0

    const profitMargin =
      revenue > 0
        ? (profit / revenue) * 100
        : 0

    if (revenue > 0) {
      generatedInsights.push({
        id: 'revenue',
        type: 'positive',
        icon: TrendingUp,
        title: 'Revenue performance',
        description: `Your current total revenue is ${formatCurrency(
          revenue
        )}. MetricMind is monitoring revenue changes across your dataset.`,
      })
    }

    if (profit > 0) {
      generatedInsights.push({
        id: 'profit',
        type:
          profitMargin >= 10
            ? 'positive'
            : 'warning',
        icon:
          profitMargin >= 10
            ? CheckCircle
            : AlertTriangle,
        title: 'Profitability insight',
        description: `Total profit is ${formatCurrency(
          profit
        )}, with an estimated overall profit margin of ${profitMargin.toFixed(
          2
        )}%.`,
      })
    }

    if (orders > 0) {
      generatedInsights.push({
        id: 'orders',
        type: 'info',
        icon: ShoppingCartIcon,
        title: 'Order activity',
        description: `${formatNumber(
          orders
        )} orders are represented in the current dataset.`,
      })
    }

    if (customers > 0) {
      generatedInsights.push({
        id: 'customers',
        type: 'info',
        icon: Activity,
        title: 'Customer activity',
        description: `${formatNumber(
          customers
        )} unique customers are represented in the current dataset.`,
      })
    }

    if (averageOrderValue > 0) {
      generatedInsights.push({
        id: 'aov',
        type: 'info',
        icon: DollarSign,
        title: 'Average order value',
        description: `The calculated average order value is approximately ${formatCurrency(
          averageOrderValue
        )}.`,
      })
    }

    if (regionRows.length > 0) {
      const sortedRegions = [...regionRows].sort(
        (a, b) =>
          getFirstNumericValue(b) -
          getFirstNumericValue(a)
      )

      const topRegion = sortedRegions[0]

      if (topRegion) {
        generatedInsights.push({
          id: 'region',
          type: 'positive',
          icon: BarChart3,
          title: 'Regional performance',
          description: `${getFirstTextValue(
            topRegion
          )} has the highest revenue value among the returned regional results.`,
        })
      }
    }

    if (categoryRows.length > 0) {
      const sortedCategories = [
        ...categoryRows,
      ].sort(
        (a, b) =>
          getFirstNumericValue(b) -
          getFirstNumericValue(a)
      )

      const topCategory =
        sortedCategories[0]

      if (topCategory) {
        generatedInsights.push({
          id: 'category',
          type: 'positive',
          icon: BarChart3,
          title: 'Category insight',
          description: `${getFirstTextValue(
            topCategory
          )} has the highest revenue value among the returned category results.`,
        })
      }
    }

    if (productRows.length > 0) {
      generatedInsights.push({
        id: 'products',
        type: 'info',
        icon: Target,
        title: 'Product performance',
        description: `MetricMind found ${formatNumber(
          productRows.length
        )} product-level result${
          productRows.length === 1
            ? ''
            : 's'
        } in the latest analysis.`,
      })
    }

    return generatedInsights
  }

  // ============================================================
  // LOAD DATA
  // ============================================================

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
        productResult,
      ] = await Promise.all([
        apiService.query({
          question:
            'What is our total revenue?',
        }),

        apiService.query({
          question:
            'What is our total profit?',
        }),

        apiService.query({
          question:
            'How many orders do we have?',
        }),

        apiService.query({
          question:
            'How many customers do we have?',
        }),

        apiService.query({
          question:
            'What is total revenue by region?',
        }),

        apiService.query({
          question:
            'What is total revenue by category?',
        }),

        apiService.query({
          question:
            'Show top 10 products by profit',
        }),
      ])

      const revenueRows =
        getRows(revenueResult)

      const profitRows =
        getRows(profitResult)

      const ordersRows =
        getRows(ordersResult)

      const customerRows =
        getRows(customersResult)

      const regionRows =
        getRows(regionResult)

      const categoryRows =
        getRows(categoryResult)

      const productRows =
        getRows(productResult)

      const revenue =
        revenueRows.length > 0
          ? getFirstNumericValue(
              revenueRows[0]
            )
          : getNumber(
              revenueResult?.data
            )

      const profit =
        profitRows.length > 0
          ? getFirstNumericValue(
              profitRows[0]
            )
          : getNumber(
              profitResult?.data
            )

      const orders =
        ordersRows.length > 0
          ? getFirstNumericValue(
              ordersRows[0]
            )
          : getNumber(
              ordersResult?.data
            )

      const customers =
        customerRows.length > 0
          ? getFirstNumericValue(
              customerRows[0]
            )
          : getNumber(
              customersResult?.data
            )

      const generated =
        buildInsights(
          revenue,
          profit,
          orders,
          customers,
          regionRows,
          categoryRows,
          productRows
        )

      setInsights(generated)

      // --------------------------------------------------------
      // REVENUE ALERTS
      // --------------------------------------------------------

      const newRevenueAlerts = []

      if (revenue <= 0) {
        newRevenueAlerts.push({
          id: 'revenue-empty',
          severity: 'critical',
          title: 'Revenue data unavailable',
          description:
            'MetricMind could not identify a positive revenue value from the current dataset.',
          icon: AlertTriangle,
        })
      } else {
        newRevenueAlerts.push({
          id: 'revenue-healthy',
          severity: 'success',
          title: 'Revenue data available',
          description: `Current recorded revenue is ${formatCurrency(
            revenue
          )}.`,
          icon: CheckCircle,
        })
      }

      setRevenueAlerts(
        newRevenueAlerts
      )

      // --------------------------------------------------------
      // PROFIT ALERTS
      // --------------------------------------------------------

      const newProfitAlerts = []

      if (profit < 0) {
        newProfitAlerts.push({
          id: 'negative-profit',
          severity: 'critical',
          title: 'Negative profit detected',
          description: `The current dataset shows total profit of ${formatCurrency(
            profit
          )}.`,
          icon: TrendingDown,
        })
      } else if (profit === 0) {
        newProfitAlerts.push({
          id: 'zero-profit',
          severity: 'warning',
          title: 'Profit is zero',
          description:
            'The current dataset does not show positive total profit.',
          icon: AlertTriangle,
        })
      } else {
        const margin =
          revenue > 0
            ? (profit / revenue) * 100
            : 0

        newProfitAlerts.push({
          id: 'positive-profit',
          severity:
            margin < 5
              ? 'warning'
              : 'success',
          title:
            margin < 5
              ? 'Low profit margin'
              : 'Profit performance',
          description: `Total profit is ${formatCurrency(
            profit
          )}, with an estimated margin of ${margin.toFixed(
            2
          )}%.`,
          icon:
            margin < 5
              ? AlertTriangle
              : CheckCircle,
        })
      }

      setProfitAlerts(
        newProfitAlerts
      )

      // --------------------------------------------------------
      // PERFORMANCE ALERTS
      // --------------------------------------------------------

      const newPerformanceAlerts = []

      if (orders === 0) {
        newPerformanceAlerts.push({
          id: 'orders',
          severity: 'warning',
          title: 'No order activity detected',
          description:
            'MetricMind did not find order activity in the current result.',
          icon: AlertTriangle,
        })
      } else {
        newPerformanceAlerts.push({
          id: 'orders',
          severity: 'success',
          title: 'Order activity detected',
          description: `${formatNumber(
            orders
          )} orders are currently represented in the dataset.`,
          icon: CheckCircle,
        })
      }

      if (customers === 0) {
        newPerformanceAlerts.push({
          id: 'customers',
          severity: 'warning',
          title: 'Customer data unavailable',
          description:
            'No customer count was returned by the analytics service.',
          icon: AlertTriangle,
        })
      } else {
        newPerformanceAlerts.push({
          id: 'customers',
          severity: 'success',
          title: 'Customer data available',
          description: `${formatNumber(
            customers
          )} customers are represented in the dataset.`,
          icon: UsersIcon,
        })
      }

      if (regionRows.length === 0) {
        newPerformanceAlerts.push({
          id: 'region-data',
          severity: 'warning',
          title: 'Regional analysis unavailable',
          description:
            'No regional result was returned from the current analytics query.',
          icon: AlertTriangle,
        })
      }

      if (categoryRows.length === 0) {
        newPerformanceAlerts.push({
          id: 'category-data',
          severity: 'warning',
          title: 'Category analysis unavailable',
          description:
            'No category result was returned from the current analytics query.',
          icon: AlertTriangle,
        })
      }

      setPerformanceAlerts(
        newPerformanceAlerts
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

      setInsights([])
      setRevenueAlerts([])
      setProfitAlerts([])
      setPerformanceAlerts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadInsights()
  }, [])

  // ============================================================
  // ALERT CARD
  // ============================================================

  function AlertCard({
    alert,
  }) {
    const Icon =
      alert.icon || Bell

    return (
      <div
        className={`alert-card ${alert.severity}`}
      >
        <div className="alert-icon">
          <Icon size={20} />
        </div>

        <div className="alert-content">
          <div className="alert-top">
            <h3>
              {alert.title}
            </h3>

            <span className="severity-badge">
              {alert.severity}
            </span>
          </div>

          <p>
            {alert.description}
          </p>
        </div>
      </div>
    )
  }

  // ============================================================
  // INSIGHT CARD
  // ============================================================

  function InsightCard({
    insight,
  }) {
    const Icon =
      insight.icon || Sparkles

    return (
      <div
        className={`insight-card ${insight.type}`}
      >
        <div className="insight-icon">
          <Icon size={21} />
        </div>

        <div>
          <h3>
            {insight.title}
          </h3>

          <p>
            {insight.description}
          </p>
        </div>
      </div>
    )
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="insights-page">
        <div className="insights-loading">
          <RefreshCw
            size={32}
            className="spin"
          />

          <h2>
            Analyzing your business data...
          </h2>

          <p>
            MetricMind is generating insights
            and checking alerts.
          </p>
        </div>
      </div>
    )
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="insights-page">
      <div className="insights-container">

        {/* HEADER */}

        <header className="insights-header">

          <div className="insights-heading">

            <button
              type="button"
              className="back-button"
              onClick={() =>
                navigate('/')
              }
            >
              <ArrowLeft size={18} />
              Dashboard
            </button>

            <div className="title-row">
              <div className="title-icon">
                <Bell size={28} />
              </div>

              <div>
                <div className="eyebrow">
                  <Sparkles size={14} />
                  MetricMind Intelligence
                </div>

                <h1>
                  Insights & Alerts
                </h1>

                <p>
                  Understand what is happening
                  in your business data.
                </p>
              </div>
            </div>

          </div>

          <button
            type="button"
            className="refresh-insights"
            onClick={() =>
              loadInsights(true)
            }
            disabled={refreshing}
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
              ? 'Analyzing...'
              : 'Refresh Insights'}
          </button>

        </header>


        {/* ERROR */}

        {error && (
          <div className="insights-error">
            <AlertTriangle size={20} />

            <div>
              <strong>
                Unable to generate insights
              </strong>

              <p>
                {error}
              </p>
            </div>
          </div>
        )}


        {/* OVERVIEW */}

        <section className="overview-grid">

          <div className="overview-card">
            <div className="overview-icon blue">
              <Sparkles size={22} />
            </div>

            <div>
              <span>
                AI Insights
              </span>

              <strong>
                {formatNumber(
                  insights.length
                )}
              </strong>
            </div>
          </div>


          <div className="overview-card">
            <div className="overview-icon orange">
              <Bell size={22} />
            </div>

            <div>
              <span>
                Total Alerts
              </span>

              <strong>
                {formatNumber(
                  revenueAlerts.length +
                    profitAlerts.length +
                    performanceAlerts.length
                )}
              </strong>
            </div>
          </div>


          <div className="overview-card">
            <div className="overview-icon green">
              <CheckCircle size={22} />
            </div>

            <div>
              <span>
                Positive Signals
              </span>

              <strong>
                {formatNumber(
                  [
                    ...revenueAlerts,
                    ...profitAlerts,
                    ...performanceAlerts,
                  ].filter(
                    (alert) =>
                      alert.severity ===
                      'success'
                  ).length
                )}
              </strong>
            </div>
          </div>


          <div className="overview-card">
            <div className="overview-icon purple">
              <Activity size={22} />
            </div>

            <div>
              <span>
                Status
              </span>

              <strong>
                {error
                  ? 'Check'
                  : 'Healthy'}
              </strong>
            </div>
          </div>

        </section>


        {/* AI INSIGHTS */}

        <section className="insights-section">

          <div className="section-heading">
            <div className="section-heading-icon">
              <Sparkles size={21} />
            </div>

            <div>
              <h2>
                AI Insights
              </h2>

              <p>
                Automatically generated observations
                from your current business data.
              </p>
            </div>
          </div>


          {insights.length === 0 ? (
            <div className="empty-state">
              <Sparkles size={34} />

              <h3>
                No insights available
              </h3>

              <p>
                Upload a dataset or refresh the
                analytics service to generate insights.
              </p>
            </div>
          ) : (
            <div className="insights-grid">
              {insights.map(
                (insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                  />
                )
              )}
            </div>
          )}

        </section>


        {/* ALERTS */}

        <div className="alerts-grid">

          {/* REVENUE */}

          <section className="alert-section">

            <div className="section-heading compact">
              <div className="section-heading-icon revenue-icon">
                <DollarSign size={20} />
              </div>

              <div>
                <h2>
                  Revenue Alerts
                </h2>

                <p>
                  Revenue-related signals.
                </p>
              </div>
            </div>

            <div className="alert-list">
              {revenueAlerts.length ===
              0 ? (
                <div className="empty-small">
                  No revenue alerts.
                </div>
              ) : (
                revenueAlerts.map(
                  (alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                    />
                  )
                )
              )}
            </div>

          </section>


          {/* PROFIT */}

          <section className="alert-section">

            <div className="section-heading compact">
              <div className="section-heading-icon profit-icon">
                <TrendingUp size={20} />
              </div>

              <div>
                <h2>
                  Profit Alerts
                </h2>

                <p>
                  Profitability-related signals.
                </p>
              </div>
            </div>

            <div className="alert-list">
              {profitAlerts.length ===
              0 ? (
                <div className="empty-small">
                  No profit alerts.
                </div>
              ) : (
                profitAlerts.map(
                  (alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                    />
                  )
                )
              )}
            </div>

          </section>

        </div>


        {/* PERFORMANCE */}

        <section className="performance-section">

          <div className="section-heading">

            <div className="section-heading-icon performance-icon">
              <BarChart3 size={21} />
            </div>

            <div>
              <h2>
                Performance Alerts
              </h2>

              <p>
                Operational and dataset performance
                signals detected by MetricMind.
              </p>
            </div>

          </div>


          <div className="performance-list">

            {performanceAlerts.length ===
            0 ? (
              <div className="empty-state">
                <Activity size={34} />

                <h3>
                  No performance alerts
                </h3>

                <p>
                  Everything looks normal based
                  on the available data.
                </p>
              </div>
            ) : (
              performanceAlerts.map(
                (alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                  />
                )
              )
            )}

          </div>

        </section>


        {/* FOOTER */}

        <div className="insights-footer">
          <div>
            <Sparkles size={16} />

            <span>
              Insights are generated from the
              currently active MetricMind dataset.
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/dataset')
            }
          >
            Manage Dataset
          </button>
        </div>

      </div>
    </div>
  )
}


// ============================================================
// ICON HELPERS
// ============================================================

function ShoppingCartIcon(
  props
) {
  return (
    <ShoppingCartFallback
      {...props}
    />
  )
}

function ShoppingCartFallback(
  props
) {
  return (
    <ShoppingCartIconComponent
      {...props}
    />
  )
}

function ShoppingCartIconComponent(
  props
) {
  return (
    <ShoppingCart
      {...props}
    />
  )
}

function UsersIcon(props) {
  return (
    <UsersFallback
      {...props}
    />
  )
}

function UsersFallback(props) {
  return (
    <Users
      {...props}
    />
  )
}

export default InsightsAlerts