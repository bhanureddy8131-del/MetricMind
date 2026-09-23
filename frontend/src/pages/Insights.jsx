import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  Bell,
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Lightbulb,
  Activity,
} from 'lucide-react'

import { apiService } from '../services/api'

import './Insights.css'

function Insights() {
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

  const [insights, setInsights] = useState([])
  const [alerts, setAlerts] = useState([])

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    loadInsights()
  }, [])

  async function loadInsights() {
    try {
      setLoading(true)
      setRefreshing(true)
      setError('')

      const [
        revenueResult,
        profitResult,
        ordersResult,
        customersResult,
      ] = await Promise.all([
        askQuery('What is our total revenue?'),
        askQuery('What is our total profit?'),
        askQuery('How many orders do we have?'),
        askQuery('How many customers do we have?'),
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

      generateInsights({
        revenue,
        profit,
        orders,
        customers,
      })
    } catch (err) {
      console.error('Insights loading error:', err)

      setError(
        err?.message ||
          'Unable to load insights.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // =====================================================
  // AI QUERY
  // =====================================================

  async function askQuery(question) {
    try {
      return await apiService.query({
        question,
      })
    } catch (err) {
      console.error(
        'Insight query failed:',
        question,
        err
      )

      return null
    }
  }

  // =====================================================
  // EXTRACT NUMBER
  // =====================================================

  function extractNumber(result) {
    if (!result) {
      return 0
    }

    if (Array.isArray(result.data)) {
      if (result.data.length === 0) {
        return 0
      }

      const first = result.data[0]

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
            value !== null &&
            value !== '' &&
            Number.isFinite(number)
          ) {
            return number
          }
        }
      }
    }

    if (
      typeof result.data === 'number'
    ) {
      return result.data
    }

    if (
      result.data &&
      typeof result.data === 'object'
    ) {
      for (const value of Object.values(
        result.data
      )) {
        const number = Number(value)

        if (
          value !== null &&
          value !== '' &&
          Number.isFinite(number)
        ) {
          return number
        }
      }
    }

    if (
      typeof result.answer === 'string'
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

  // =====================================================
  // GENERATE INSIGHTS
  // =====================================================

  function generateInsights(data) {
    const {
      revenue,
      profit,
      orders,
      customers,
    } = data

    const generatedInsights = []
    const generatedAlerts = []

    const profitMargin =
      revenue > 0
        ? (profit / revenue) * 100
        : 0

    // Revenue insight
    if (revenue > 0) {
      generatedInsights.push({
        id: 'revenue',
        type: 'positive',
        icon: TrendingUp,
        title: 'Revenue Performance',
        text:
          `Your business has generated ` +
          `${formatCurrency(revenue)} in total revenue.`,
      })
    }

    // Profit insight
    if (profit > 0) {
      generatedInsights.push({
        id: 'profit',
        type: 'positive',
        icon: DollarSign,
        title: 'Profit Performance',
        text:
          `Total profit is ${formatCurrency(
            profit
          )}, with an estimated margin of ${profitMargin.toFixed(
            1
          )}%.`,
      })
    }

    // Order insight
    if (orders > 0) {
      generatedInsights.push({
        id: 'orders',
        type: 'info',
        icon: ShoppingCart,
        title: 'Order Activity',
        text:
          `The dataset contains ${formatNumber(
            orders
          )} unique orders.`,
      })
    }

    // Customer insight
    if (customers > 0) {
      generatedInsights.push({
        id: 'customers',
        type: 'info',
        icon: Users,
        title: 'Customer Base',
        text:
          `MetricMind is tracking ${formatNumber(
            customers
          )} unique customers.`,
      })
    }

    // =================================================
    // ALERTS
    // =================================================

    if (profit < 0) {
      generatedAlerts.push({
        id: 'negative-profit',
        severity: 'critical',
        icon: AlertTriangle,
        title: 'Negative Profit',
        text:
          'Total profit is currently negative. Review costs, discounts and low-margin products.',
      })
    } else if (
      revenue > 0 &&
      profitMargin < 10
    ) {
      generatedAlerts.push({
        id: 'low-margin',
        severity: 'warning',
        icon: AlertTriangle,
        title: 'Low Profit Margin',
        text:
          `Current estimated profit margin is ${profitMargin.toFixed(
            1
          )}%. Review pricing, discounts and operating costs.`,
      })
    } else {
      generatedAlerts.push({
        id: 'healthy-profit',
        severity: 'success',
        icon: CheckCircle,
        title: 'Profitability Looks Healthy',
        text:
          'The current dataset shows a positive overall profit.',
      })
    }

    if (revenue > 0 && orders > 0) {
      const averageOrderValue =
        revenue / orders

      generatedAlerts.push({
        id: 'average-order',
        severity: 'info',
        icon: Activity,
        title: 'Average Order Value',
        text:
          `Average revenue per order is approximately ${formatCurrency(
            averageOrderValue
          )}.`,
      })
    }

    setInsights(generatedInsights)
    setAlerts(generatedAlerts)
  }

  // =====================================================
  // FORMATTING
  // =====================================================

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

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="insights-page">

      {/* HEADER */}

      <div className="insights-header">

        <button
          type="button"
          className="insights-back-button"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="insights-heading">

          <div className="insights-heading-icon">
            <Bell size={28} />
          </div>

          <div>
            <div className="insights-eyebrow">
              <Sparkles size={15} />
              MetricMind Intelligence
            </div>

            <h1>
              Insights & Alerts
            </h1>

            <p>
              AI-powered insights and
              performance alerts from your
              business data.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="insights-refresh-button"
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

      {/* ERROR */}

      {error && (
        <div className="insights-error">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI SUMMARY */}

      <section className="insights-kpis">

        <div className="insight-kpi-card">

          <div className="insight-kpi-icon revenue">
            <DollarSign size={22} />
          </div>

          <div>
            <span>Total Revenue</span>

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
            <span>Total Profit</span>

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

          <div className="insight-kpi-icon orders">
            <ShoppingCart size={22} />
          </div>

          <div>
            <span>Total Orders</span>

            <strong>
              {loading
                ? 'Loading...'
                : formatNumber(
                    kpis.orders
                  )}
            </strong>
          </div>

        </div>

        <div className="insight-kpi-card">

          <div className="insight-kpi-icon customers">
            <Users size={22} />
          </div>

          <div>
            <span>Total Customers</span>

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

      {/* MAIN CONTENT */}

      <div className="insights-grid">

        {/* AI INSIGHTS */}

        <section className="insights-card">

          <div className="insights-card-header">

            <div>
              <div className="card-title">
                <Sparkles size={20} />
                AI Insights
              </div>

              <p>
                Automatically generated
                observations from your dataset.
              </p>
            </div>

            <span className="live-badge">
              LIVE
            </span>

          </div>

          <div className="insight-list">

            {loading ? (
              <div className="insights-loading">
                <RefreshCw
                  size={22}
                  className="spin"
                />

                <span>
                  Analyzing your business data...
                </span>
              </div>
            ) : insights.length === 0 ? (
              <div className="insights-empty">
                <Lightbulb size={30} />

                <p>
                  No insights available yet.
                </p>
              </div>
            ) : (
              insights.map((insight) => {

                const Icon =
                  insight.icon

                return (
                  <div
                    className={`insight-item ${insight.type}`}
                    key={insight.id}
                  >
                    <div className="insight-icon">
                      <Icon size={20} />
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
              })
            )}

          </div>

        </section>

        {/* ALERTS */}

        <section className="insights-card">

          <div className="insights-card-header">

            <div>
              <div className="card-title">
                <Bell size={20} />
                Performance Alerts
              </div>

              <p>
                Important conditions detected
                in your business data.
              </p>
            </div>

            <span className="alert-count">
              {alerts.length}
            </span>

          </div>

          <div className="alert-list">

            {loading ? (
              <div className="insights-loading">
                <RefreshCw
                  size={22}
                  className="spin"
                />

                <span>
                  Checking alerts...
                </span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="insights-empty">
                <CheckCircle size={30} />

                <p>
                  No alerts detected.
                </p>
              </div>
            ) : (
              alerts.map((alert) => {

                const Icon =
                  alert.icon

                return (
                  <div
                    className={`alert-item ${alert.severity}`}
                    key={alert.id}
                  >

                    <div className="alert-icon">
                      <Icon size={20} />
                    </div>

                    <div>
                      <h3>
                        {alert.title}
                      </h3>

                      <p>
                        {alert.text}
                      </p>
                    </div>

                  </div>
                )
              })
            )}

          </div>

        </section>

      </div>

      {/* QUICK ACTIONS */}

      <section className="insights-card quick-actions-card">

        <div className="insights-card-header">

          <div>
            <div className="card-title">
              <Activity size={20} />
              Intelligence Center
            </div>

            <p>
              Continue analyzing your business
              performance.
            </p>
          </div>

        </div>

        <div className="quick-actions">

          <button
            type="button"
            onClick={() =>
              navigate('/ai-query')
            }
          >
            <Sparkles size={19} />
            Ask AI Copilot
          </button>

          <button
            type="button"
            onClick={() =>
              navigate('/analytics')
            }
          >
            <TrendingUp size={19} />
            Open Analytics
          </button>

          <button
            type="button"
            onClick={() =>
              navigate('/reports')
            }
          >
            <Activity size={19} />
            View Reports
          </button>

        </div>

      </section>

    </div>
  )
}

export default Insights