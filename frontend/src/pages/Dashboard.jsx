import { useEffect, useState } from 'react'

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Database,
  PieChart,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'

import { apiService } from '../services/api'
import { useAuth } from '../context/useAuth'

import MetricCard from '../components/MetricCard'
import ChartCard from '../components/ChartCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

// ======================================================
// HELPERS
// ======================================================

function getResponseData(response) {
  return response?.data || null
}

function getRows(response) {
  const data = getResponseData(response)

  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  return []
}

function getFirstRow(response) {
  const rows = getRows(response)

  if (rows.length > 0) {
    return rows[0]
  }

  return null
}

function findNumber(value) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,]/g, '')
    const number = Number(cleaned)

    if (!Number.isNaN(number)) {
      return number
    }

    const match = value.match(/-?[\d,]+(?:\.\d+)?/)

    if (match) {
      return Number(match[0].replace(/,/g, ''))
    }
  }

  return 0
}

function getMetricValue(response, keys = []) {
  const row = getFirstRow(response)

  if (row) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        return findNumber(row[key])
      }
    }
  }

  const answer = getResponseData(response)?.answer

  if (answer) {
    return findNumber(answer)
  }

  return 0
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`
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

      sales: findNumber(
        item.sales ??
        item.revenue ??
        item.total_sales ??
        item.value ??
        item.profit
      ),
    }))
    .filter((item) => item.region !== 'Unknown' || item.sales !== 0)
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

      sales: findNumber(
        item.sales ??
        item.revenue ??
        item.total_sales ??
        item.value ??
        item.profit
      ),
    }))
    .filter((item) => item.category !== 'Unknown' || item.sales !== 0)
}

function normalizeProductData(response) {
  const rows = getRows(response)

  return rows
    .slice(0, 10)
    .map((item) => ({
      product:
        item.product ??
        item.product_name ??
        item.Product ??
        item['Product Name'] ??
        item.name ??
        'Unknown',

      sales: findNumber(
        item.sales ??
        item.revenue ??
        item.total_sales ??
        item.value ??
        item.profit
      ),
    }))
    .filter((item) => item.product !== 'Unknown' || item.sales !== 0)
}

// ======================================================
// DASHBOARD
// ======================================================

export default function Dashboard() {
  const { user } = useAuth()

  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    error: '',

    backendOnline: false,

    totalRevenue: 0,
    totalProfit: 0,
    totalOrders: 0,
    totalCustomers: 0,

    revenueByRegion: [],
    salesByCategory: [],
    topProducts: [],
  })

  // ====================================================
  // LOAD DASHBOARD
  // ====================================================

  const fetchDashboardData = async (isRefresh = false) => {
    setState((current) => ({
      ...current,

      ...(isRefresh
        ? { refreshing: true }
        : { loading: true }),

      error: '',
    }))

    try {
      // ------------------------------------------------
      // 1. HEALTH
      // ------------------------------------------------

      const healthResult = await apiService.health()

      // ------------------------------------------------
      // 2. KPI QUERIES
      // ------------------------------------------------

      const results = await Promise.allSettled([
        apiService.query('What is our total revenue?'),

        apiService.query('What is our total profit?'),

        apiService.query('How many orders do we have?'),

        apiService.query('How many customers do we have?'),

        apiService.query('What is total revenue by region?'),

        apiService.query('What is total revenue by category?'),

        apiService.query('Show top 10 products by profit'),
      ])

      const [
        revenueResult,
        profitResult,
        ordersResult,
        customersResult,
        regionResult,
        categoryResult,
        productsResult,
      ] = results

      // ------------------------------------------------
      // 3. READ KPI RESULTS
      // ------------------------------------------------

      const totalRevenue =
        revenueResult.status === 'fulfilled'
          ? getMetricValue(revenueResult.value, [
              'revenue',
              'total_revenue',
              'sales',
              'total_sales',
            ])
          : 0

      const totalProfit =
        profitResult.status === 'fulfilled'
          ? getMetricValue(profitResult.value, [
              'profit',
              'total_profit',
            ])
          : 0

      const totalOrders =
        ordersResult.status === 'fulfilled'
          ? getMetricValue(ordersResult.value, [
              'orders',
              'total_orders',
              'order_count',
            ])
          : 0

      const totalCustomers =
        customersResult.status === 'fulfilled'
          ? getMetricValue(customersResult.value, [
              'customers',
              'total_customers',
              'customer_count',
            ])
          : 0

      // ------------------------------------------------
      // 4. CHART DATA
      // ------------------------------------------------

      const revenueByRegion =
        regionResult.status === 'fulfilled'
          ? normalizeRegionData(regionResult.value)
          : []

      const salesByCategory =
        categoryResult.status === 'fulfilled'
          ? normalizeCategoryData(categoryResult.value)
          : []

      const topProducts =
        productsResult.status === 'fulfilled'
          ? normalizeProductData(productsResult.value)
          : []

      // ------------------------------------------------
      // 5. CHECK PARTIAL FAILURES
      // ------------------------------------------------

      const failedQueries = results.filter(
        (result) => result.status === 'rejected'
      )

      let errorMessage = ''

      if (failedQueries.length === results.length) {
        errorMessage =
          'MetricMind backend is online, but the analytics queries could not be completed.'
      } else if (failedQueries.length > 0) {
        errorMessage =
          'Some dashboard sections could not be loaded. Available data is still displayed.'
      }

      // ------------------------------------------------
      // 6. UPDATE STATE
      // ------------------------------------------------

      setState({
        loading: false,
        refreshing: false,
        error: errorMessage,

        backendOnline: Boolean(healthResult?.data),

        totalRevenue,
        totalProfit,
        totalOrders,
        totalCustomers,

        revenueByRegion,
        salesByCategory,
        topProducts,
      })
    } catch (error) {
      console.error('Dashboard error:', error)

      setState((current) => ({
        ...current,

        loading: false,
        refreshing: false,

        backendOnline: false,

        error:
          error?.message ||
          'Unable to connect to MetricMind backend.',
      }))
    }
  }

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // ====================================================
  // LOADING
  // ====================================================

  if (state.loading) {
    return <LoadingSpinner label="Loading dashboard" />
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="page">

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="page-heading">

        <div>
          <p className="eyebrow">OVERVIEW</p>

          <h1>
            Good morning,{' '}
            {user?.full_name ||
              user?.username ||
              'there'}
            .
          </h1>

          <p className="muted">
            A live pulse check of your MetricMind
            workspace.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >

          <button
            type="button"
            className="secondary-button"
            onClick={() => fetchDashboardData(true)}
            disabled={state.refreshing}
          >
            <RefreshCw
              size={17}
              className={
                state.refreshing ? 'spin' : ''
              }
            />

            {state.refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

          <a
            className="primary-button"
            href="/query"
          >
            <Sparkles size={17} />

            Ask a question
          </a>

        </div>

      </div>

      {/* ============================================== */}
      {/* ERROR */}
      {/* ============================================== */}

      <ErrorMessage message={state.error} />

      {/* ============================================== */}
      {/* BACKEND STATUS */}
      {/* ============================================== */}

      <div
        className="card"
        style={{
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >

          <Database size={20} />

          <div>
            <strong>MetricMind API</strong>

            <div className="muted">
              {state.backendOnline
                ? 'Backend connected successfully'
                : 'Backend unavailable'}
            </div>
          </div>

        </div>

        <span>
          {state.backendOnline
            ? '● Online'
            : '● Offline'}
        </span>

      </div>

      {/* ============================================== */}
      {/* KPI CARDS */}
      {/* ============================================== */}

      <div className="metrics-grid">

        <MetricCard
          icon={Database}
          label="Total Revenue"
          value={formatCurrency(
            state.totalRevenue
          )}
          detail="Revenue from all transactions"
          tone="blue"
        />

        <MetricCard
          icon={TrendingUp}
          label="Total Profit"
          value={formatCurrency(
            state.totalProfit
          )}
          detail="Net profit after costs"
          tone="green"
        />

        <MetricCard
          icon={ShoppingCart}
          label="Total Orders"
          value={Number(
            state.totalOrders
          ).toLocaleString()}
          detail="Number of unique orders"
          tone="amber"
        />

        <MetricCard
          icon={Users}
          label="Total Customers"
          value={Number(
            state.totalCustomers
          ).toLocaleString()}
          detail="Unique customer count"
          tone="purple"
        />

      </div>

      {/* ============================================== */}
      {/* AI COPILOT */}
      {/* ============================================== */}

      <div className="welcome-band">

        <div>

          <span className="kicker">
            YOUR ANALYTICS COPILOT
          </span>

          <h2>
            Turn a business question into a
            confident next move.
          </h2>

          <p>
            MetricMind connects natural language,
            governed SQL, and decision-ready visuals.
          </p>

        </div>

        <ArrowUpRight size={26} />

      </div>

      {/* ============================================== */}
      {/* SALES PERFORMANCE */}
      {/* ============================================== */}

      <section className="section">

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px',
          }}
        >

          <BarChart3 size={22} />

          <h3 style={{ margin: 0 }}>
            Sales Performance
          </h3>

        </div>

        <div className="section-grid">

          <ChartCard
            title="Revenue by Region"
            data={state.revenueByRegion}
            type="bar"
            dataKey="region"
            valueKey="sales"
          />

          <ChartCard
            title="Top 10 Products"
            data={state.topProducts}
            type="bar"
            dataKey="product"
            valueKey="sales"
          />

        </div>

      </section>

      {/* ============================================== */}
      {/* CATEGORY */}
      {/* ============================================== */}

      <section className="section">

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px',
          }}
        >

          <PieChart size={22} />

          <h3 style={{ margin: 0 }}>
            Revenue Distribution
          </h3>

        </div>

        <div className="section-grid">

          {state.salesByCategory.length > 0 ? (

            <ChartCard
              title="Sales by Category"
              data={state.salesByCategory}
              type="pie"
              dataKey="category"
              valueKey="sales"
            />

          ) : (

            <div className="card">

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >

                <PieChart size={24} />

                <div>

                  <strong>
                    Category data is not available
                  </strong>

                  <p className="muted">
                    No category-level results were
                    returned by the current dataset.
                  </p>

                </div>

              </div>

            </div>

          )}

        </div>

      </section>

      {/* ============================================== */}
      {/* ANALYTICS SUMMARY */}
      {/* ============================================== */}

      <section className="section">

        <h3>Analytics Summary</h3>

        <div className="section-grid">

          <div className="card">

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >

              <Activity size={25} />

              <div>

                <strong>
                  Revenue
                </strong>

                <p className="muted">
                  {formatCurrency(
                    state.totalRevenue
                  )}{' '}
                  generated across all transactions.
                </p>

              </div>

            </div>

          </div>

          <div className="card">

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >

              <TrendingUp size={25} />

              <div>

                <strong>
                  Profit
                </strong>

                <p className="muted">
                  {formatCurrency(
                    state.totalProfit
                  )}{' '}
                  total profit recorded.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ============================================== */}
      {/* NEXT STEPS */}
      {/* ============================================== */}

      <section className="section">

        <h3>Next Steps</h3>

        <ul>

          <li>
            <strong>Ask MetricMind:</strong>{' '}
            Use natural language to query your data.
          </li>

          <li>
            <strong>Explore Analytics:</strong>{' '}
            Analyze regional and product performance.
          </li>

          <li>
            <strong>Manage Data:</strong>{' '}
            Upload datasets and manage records.
          </li>

        </ul>

      </section>

    </div>
  )
}