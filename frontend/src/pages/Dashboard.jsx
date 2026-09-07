import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Database,
  Layers3,
  MessageSquare,
  Sparkles,
  ShoppingCart,
  Users,
  RefreshCw,
  TrendingUp,
  BarChart3,
  PieChart
} from 'lucide-react'

import { apiService } from '../services/api'
import { useAuth } from '../context/useAuth'
import MetricCard from '../components/MetricCard'
import ChartCard from '../components/ChartCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function Dashboard() {
  const { user } = useAuth()

  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    error: '',
    kpis: null,
    status: null,
    metrics: null,
    dimensions: null,
    salesByRegion: [],
    topProducts: [],
    revenueByRegion: [],
    salesByCategory: [],
    revenueTrend: [],
    profitTrend: []
  })

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      setState((current) => ({
        ...current,
        ...(isRefresh
          ? { refreshing: true }
          : { loading: true }),
        error: ''
      }))

      const [
        status,
        kpis,
        metrics,
        dimensions,
        regionData,
        topProducts
      ] = await Promise.all([
        apiService.status(),
        apiService.getDashboardKPIs(),
        apiService.metrics(),
        apiService.dimensions(),
        apiService.getSalesByRegion(),
        apiService.getTopProducts(10)
      ])

      const region = regionData?.data || []
      const products = topProducts?.data || []

      /*
       * Convert backend region data into formats usable by
       * bar and pie charts.
       */
      const revenueByRegion = region.map((item) => ({
        region:
          item.region ||
          item.Region ||
          item.name ||
          'Unknown',
        revenue:
          Number(
            item.revenue ??
            item.sales ??
            item.total_sales ??
            item.value ??
            0
          )
      }))

      /*
       * If the backend returns category information through
       * metrics/dimensions, use it. Otherwise keep an empty
       * array instead of creating fake data.
       */
      let salesByCategory = []

      if (Array.isArray(metrics?.data)) {
        salesByCategory = metrics.data
          .filter(
            (item) =>
              item.category ||
              item.Category ||
              item.name
          )
          .map((item) => ({
            category:
              item.category ||
              item.Category ||
              item.name ||
              'Unknown',
            sales: Number(
              item.sales ??
              item.revenue ??
              item.total_sales ??
              item.value ??
              0
            )
          }))
      }

      /*
       * Do not create fake trend data.
       * These arrays will be populated if your backend
       * provides trend information.
       */
      const revenueTrend =
        kpis?.data?.revenue_trend ||
        kpis?.data?.sales_trend ||
        []

      const profitTrend =
        kpis?.data?.profit_trend ||
        []

      setState({
        loading: false,
        refreshing: false,
        error: '',
        status: status?.data || null,
        kpis: kpis?.data || null,
        metrics: metrics?.data || null,
        dimensions: dimensions?.data || null,
        salesByRegion: region,
        topProducts: products,
        revenueByRegion,
        salesByCategory,
        revenueTrend,
        profitTrend
      })
    } catch (error) {
      console.error('Dashboard error:', error)

      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error:
          error?.response?.data?.detail ||
          error?.message ||
          'Unable to load dashboard data.'
      }))
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (state.loading) {
    return <LoadingSpinner label="Loading dashboard" />
  }

  const kpis = state.kpis || {
    total_sales: 0,
    total_profit: 0,
    total_orders: 0,
    total_customers: 0
  }

  const totalRevenue =
    Number(
      kpis.total_revenue ??
      kpis.total_sales ??
      0
    )

  const totalProfit =
    Number(kpis.total_profit ?? 0)

  const totalOrders =
    Number(kpis.total_orders ?? 0)

  const totalCustomers =
    Number(kpis.total_customers ?? 0)

  const formatCurrency = (value) =>
    `$${Number(value || 0).toLocaleString('en-US', {
      maximumFractionDigits: 0
    })}`

  const backendOnline =
    state.status?.status === 'ok' ||
    state.status?.status === 'healthy' ||
    state.status?.message

  return (
    <div className="page">

      {/* ================= HEADER ================= */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>

          <h1>
            Good morning,{' '}
            {user?.full_name || user?.username || 'there'}.
          </h1>

          <p className="muted">
            A live pulse check of your MetricMind workspace.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
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

      {/* ================= ERROR ================= */}
      <ErrorMessage message={state.error} />

      {/* ================= BACKEND STATUS ================= */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <Database size={20} />

          <div>
            <strong>MetricMind API</strong>

            <div className="muted">
              {backendOnline
                ? 'Backend connected successfully'
                : 'Backend status unavailable'}
            </div>
          </div>
        </div>

        <span>
          {backendOnline
            ? '● Online'
            : '● Offline'}
        </span>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="metrics-grid">

        <MetricCard
          icon={Database}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          detail="Revenue from all transactions"
          tone="blue"
        />

        <MetricCard
          icon={TrendingUp}
          label="Total Profit"
          value={formatCurrency(totalProfit)}
          detail="Net profit after costs"
          tone="green"
        />

        <MetricCard
          icon={ShoppingCart}
          label="Total Orders"
          value={totalOrders.toLocaleString()}
          detail="Number of unique orders"
          tone="amber"
        />

        <MetricCard
          icon={Users}
          label="Total Customers"
          value={totalCustomers.toLocaleString()}
          detail="Unique customer count"
          tone="purple"
        />

      </div>

      {/* ================= AI COPILOT ================= */}
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

      {/* ================= REVENUE / PROFIT TRENDS ================= */}
      <section className="section">

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px'
          }}
        >
          <TrendingUp size={22} />

          <h3 style={{ margin: 0 }}>
            Performance Trends
          </h3>
        </div>

        {state.revenueTrend.length > 0 ||
        state.profitTrend.length > 0 ? (

          <div className="section-grid">

            {state.revenueTrend.length > 0 && (
              <ChartCard
                title="Revenue Trend"
                data={state.revenueTrend}
                type="line"
                dataKey="period"
                valueKey="revenue"
              />
            )}

            {state.profitTrend.length > 0 && (
              <ChartCard
                title="Profit Trend"
                data={state.profitTrend}
                type="line"
                dataKey="period"
                valueKey="profit"
              />
            )}

          </div>

        ) : (

          <div className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <BarChart3 size={24} />

              <div>
                <strong>
                  Trend data is not available yet
                </strong>

                <p className="muted">
                  Your backend currently provides
                  KPI, region, and product data.
                  Revenue/profit trend charts will
                  appear automatically when the API
                  returns trend data.
                </p>
              </div>
            </div>
          </div>

        )}

      </section>

      {/* ================= REGION + PRODUCTS ================= */}
      <section className="section">

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px'
          }}
        >
          <BarChart3 size={22} />

          <h3 style={{ margin: 0 }}>
            Sales Performance
          </h3>
        </div>

        <div className="section-grid">

          <ChartCard
            title="Sales by Region"
            data={state.salesByRegion || []}
            type="bar"
            dataKey="region"
            valueKey="sales"
          />

          <ChartCard
            title="Top 10 Products"
            data={state.topProducts || []}
            type="bar"
            dataKey="product"
            valueKey="sales"
          />

        </div>

      </section>

      {/* ================= PIE CHARTS ================= */}
      <section className="section">

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px'
          }}
        >
          <PieChart size={22} />

          <h3 style={{ margin: 0 }}>
            Revenue Distribution
          </h3>
        </div>

        <div className="section-grid">

          {/* Revenue by Region */}
          <ChartCard
            title="Revenue by Region"
            data={
              state.revenueByRegion.length > 0
                ? state.revenueByRegion
                : state.salesByRegion || []
            }
            type="pie"
            dataKey="region"
            valueKey={
              state.revenueByRegion.length > 0
                ? 'revenue'
                : 'sales'
            }
          />

          {/* Sales by Category */}
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
                  gap: '12px'
                }}
              >

                <PieChart size={24} />

                <div>

                  <strong>
                    Category data is not available
                  </strong>

                  <p className="muted">
                    The current API does not return
                    category-level sales data yet.
                    Once it is added, this pie chart
                    will display automatically.
                  </p>

                </div>

              </div>

            </div>

          )}

        </div>

      </section>

      {/* ================= ANALYTICS SUMMARY ================= */}
      <section className="section">

        <h3>Analytics Summary</h3>

        <div className="section-grid">

          <div className="card">

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >

              <Activity size={25} />

              <div>

                <strong>
                  Revenue
                </strong>

                <p className="muted">
                  {formatCurrency(totalRevenue)}
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
                gap: '12px'
              }}
            >

              <TrendingUp size={25} />

              <div>

                <strong>
                  Profit
                </strong>

                <p className="muted">
                  {formatCurrency(totalProfit)}
                  total profit recorded.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================= NEXT STEPS ================= */}
      <section className="section">

        <h3>Next Steps</h3>

        <ul>

          <li>
            <strong>Ask MetricMind:</strong>{' '}
            Use natural language to query your data.
          </li>

          <li>
            <strong>Explore Analytics:</strong>{' '}
            Dive into regional and product performance.
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