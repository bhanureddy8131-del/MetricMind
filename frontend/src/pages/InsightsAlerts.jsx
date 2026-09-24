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
  Target,
} from 'lucide-react'

import { apiService } from '../services/api'
import './InsightsAlerts.css'

function InsightsAlerts() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [kpis, setKpis] = useState({
    revenue: 0,
    profit: 0,
    orders: 0,
    customers: 0,
  })

  const [insights, setInsights] = useState([])

  const [alerts, setAlerts] = useState({
    revenue: [],
    profit: [],
    performance: [],
  })

  useEffect(() => {
    loadInsights()
  }, [])

  async function loadInsights() {
    try {
      setLoading(true)
      setRefreshing(true)

      const [
        revenueResult,
        profitResult,
        ordersResult,
        customersResult,
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
      ])

      const revenue = extractNumber(revenueResult)
      const profit = extractNumber(profitResult)
      const orders = extractNumber(ordersResult)
      const customers = extractNumber(customersResult)

      setKpis({
        revenue,
        profit,
        orders,
        customers,
      })

      generateInsights(
        revenue,
        profit,
        orders,
        customers
      )

    } catch (error) {
      console.error(
        'Insights loading error:',
        error
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function extractNumber(result) {
    if (!result) {
      return 0
    }

    const data =
      result?.data ||
      result?.results ||
      result

    if (Array.isArray(data)) {
      const first = data[0]

      if (typeof first === 'number') {
        return first
      }

      if (
        first &&
        typeof first === 'object'
      ) {
        for (const value of Object.values(first)) {
          const number = Number(value)

          if (
            Number.isFinite(number)
          ) {
            return number
          }
        }
      }
    }

    if (typeof data === 'number') {
      return data
    }

    if (
      data &&
      typeof data === 'object'
    ) {
      for (const value of Object.values(data)) {
        const number = Number(value)

        if (
          Number.isFinite(number)
        ) {
          return number
        }
      }
    }

    if (
      typeof result?.answer === 'string'
    ) {
      const match =
        result.answer.match(
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

  function generateInsights(
    revenue,
    profit,
    orders,
    customers
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

    generatedInsights.push({
      type: 'revenue',
      icon: TrendingUp,
      title: 'Revenue Overview',
      text: `Your current total revenue is ${formatCurrency(
        revenue
      )}.`,
    })

    generatedInsights.push({
      type: 'profit',
      icon:
        profit >= 0
          ? TrendingUp
          : TrendingDown,
      title:
        profit >= 0
          ? 'Positive Profit'
          : 'Profit Warning',
      text: `Current profit is ${formatCurrency(
        profit
      )} with a margin of ${profitMargin.toFixed(
        2
      )}%.`,
    })

    generatedInsights.push({
      type: 'orders',
      icon: Activity,
      title: 'Order Activity',
      text: `Your dataset contains ${formatNumber(
        orders
      )} orders from ${formatNumber(
        customers
      )} customers.`,
    })

    generatedInsights.push({
      type: 'average',
      icon: Target,
      title: 'Average Order Value',
      text: `Average revenue per order is approximately ${formatCurrency(
        averageOrderValue
      )}.`,
    })

    const revenueAlerts = []

    if (revenue <= 0) {
      revenueAlerts.push({
        level: 'critical',
        title: 'Revenue unavailable',
        message:
          'No revenue value was detected in the current dataset.',
      })
    } else {
      revenueAlerts.push({
        level: 'success',
        title: 'Revenue is available',
        message: `Current revenue is ${formatCurrency(
          revenue
        )}.`,
      })
    }

    const profitAlerts = []

    if (profit < 0) {
      profitAlerts.push({
        level: 'critical',
        title: 'Negative profit',
        message:
          'The current dataset contains a negative overall profit.',
      })
    } else {
      profitAlerts.push({
        level: 'success',
        title: 'Positive profit',
        message: `Current profit is ${formatCurrency(
          profit
        )}.`,
      })
    }

    const performanceAlerts = []

    if (orders === 0) {
      performanceAlerts.push({
        level: 'critical',
        title: 'No orders detected',
        message:
          'No orders were found in the current dataset.',
      })
    } else {
      performanceAlerts.push({
        level: 'success',
        title: 'Order activity detected',
        message: `${formatNumber(
          orders
        )} orders are currently available.`,
      })
    }

    if (customers > 0) {
      performanceAlerts.push({
        level: 'info',
        title: 'Customer activity',
        message: `${formatNumber(
          customers
        )} customers are represented in the dataset.`,
      })
    }

    setInsights(generatedInsights)

    setAlerts({
      revenue: revenueAlerts,
      profit: profitAlerts,
      performance: performanceAlerts,
    })
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }
    ).format(Number(value) || 0)
  }

  function formatNumber(value) {
    return new Intl.NumberFormat(
      'en-IN'
    ).format(Number(value) || 0)
  }

  function getAlertIcon(level) {
    if (level === 'critical') {
      return AlertTriangle
    }

    if (level === 'success') {
      return CheckCircle
    }

    return Bell
  }

  function renderAlertList(items) {
    return (
      <div className="alerts-list">
        {items.length === 0 ? (
          <div className="empty-alerts">
            <CheckCircle size={24} />
            <span>
              No alerts at the moment.
            </span>
          </div>
        ) : (
          items.map((alert, index) => {
            const Icon =
              getAlertIcon(alert.level)

            return (
              <div
                key={`${alert.title}-${index}`}
                className={`alert-item ${alert.level}`}
              >
                <div className="alert-icon">
                  <Icon size={19} />
                </div>

                <div className="alert-content">
                  <strong>
                    {alert.title}
                  </strong>

                  <p>
                    {alert.message}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    )
  }

  return (
    <div className="insights-page">

      {/* HEADER */}

      <div className="insights-header">

        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="insights-title">

          <div className="insights-title-icon">
            <Bell size={28} />
          </div>

          <div>
            <h1>
              Insights & Alerts
            </h1>

            <p>
              Understand important changes
              and signals in your business data.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadInsights}
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
            ? 'Refreshing...'
            : 'Refresh'}
        </button>

      </div>


      {/* KPI SUMMARY */}

      <section className="insights-kpis">

        <div className="insight-kpi">

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


        <div className="insight-kpi">

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


        <div className="insight-kpi">

          <div className="insight-kpi-icon orders">
            <Activity size={22} />
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


        <div className="insight-kpi">

          <div className="insight-kpi-icon customers">
            <Target size={22} />
          </div>

          <div>
            <span>
              Customers
            </span>

            <strong>
              {loading
                ? 'Loading...'
                : formatNumber(
                    kpis.customers
                  )}
            </strong>
          </div>

        </div>

      </section>


      {/* AI INSIGHTS */}

      <section className="insight-section">

        <div className="section-heading">

          <div className="section-heading-icon ai">
            <Sparkles size={22} />
          </div>

          <div>
            <h2>
              AI Insights
            </h2>

            <p>
              Automatically generated observations
              from your business dataset.
            </p>
          </div>

        </div>


        <div className="insights-grid">

          {insights.map(
            (insight, index) => {

              const Icon =
                insight.icon

              return (
                <div
                  className="insight-card"
                  key={`${insight.title}-${index}`}
                >

                  <div className="insight-card-icon">
                    <Icon size={22} />
                  </div>

                  <div>
                    <h3>
                      {insight.title}
                    </h3>

                    <p>
                      {insight.text}
                    </p>
                  </div>

                </div>
              )
            }
          )}

        </div>

      </section>


      {/* ALERTS */}

      <div className="alerts-grid">

        {/* REVENUE */}

        <section className="alert-panel">

          <div className="alert-panel-header">

            <div>
              <div className="panel-icon revenue">
                <DollarSign size={21} />
              </div>

              <div>
                <h2>
                  Revenue Alerts
                </h2>

                <p>
                  Revenue-related signals
                </p>
              </div>
            </div>

            <span className="alert-count">
              {alerts.revenue.length}
            </span>

          </div>

          {renderAlertList(
            alerts.revenue
          )}

        </section>


        {/* PROFIT */}

        <section className="alert-panel">

          <div className="alert-panel-header">

            <div>
              <div className="panel-icon profit">
                <TrendingUp size={21} />
              </div>

              <div>
                <h2>
                  Profit Alerts
                </h2>

                <p>
                  Profit-related signals
                </p>
              </div>
            </div>

            <span className="alert-count">
              {alerts.profit.length}
            </span>

          </div>

          {renderAlertList(
            alerts.profit
          )}

        </section>


        {/* PERFORMANCE */}

        <section className="alert-panel">

          <div className="alert-panel-header">

            <div>
              <div className="panel-icon performance">
                <Activity size={21} />
              </div>

              <div>
                <h2>
                  Performance Alerts
                </h2>

                <p>
                  Business activity signals
                </p>
              </div>
            </div>

            <span className="alert-count">
              {alerts.performance.length}
            </span>

          </div>

          {renderAlertList(
            alerts.performance
          )}

        </section>

      </div>

    </div>
  )
}

export default InsightsAlerts