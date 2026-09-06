import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Database,
  Layers3,
  MessageSquare,
  Sparkles,
  Server,
  ShoppingCart,
  Users,
  RefreshCw,
  BarChart3
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
    error: '',
    kpis: null,
    status: null,
    metrics: null,
    dimensions: null,
    salesByRegion: null,
    topProducts: null
  })

  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setState((current) => ({
          ...current,
          loading: true,
          error: ''
        }))
      }

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

      setState({
        loading: false,
        error: '',
        status: status?.data || null,
        kpis: kpis?.data || null,
        metrics: metrics?.data || null,
        dimensions: dimensions?.data || null,
        salesByRegion: regionData?.data || [],
        topProducts: topProducts?.data || []
      })
    } catch (error) {
      console.error('Dashboard error:', error)

      setState((current) => ({
        ...current,
        loading: false,
        error:
          error?.response?.data?.detail ||
          error?.message ||
          'Unable to load dashboard data.'
      }))
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (state.loading) {
    return <LoadingSpinner label="Loading MetricMind dashboard..." />
  }

  const kpis = state.kpis || {
    total_sales: 0,
    total_profit: 0,
    total_orders: 0,
    total_customers: 0
  }

  const formatCurrency = (value) => {
    return `$${Number(value || 0).toLocaleString('en-US', {
      maximumFractionDigits: 0
    })}`
  }

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString('en-US')
  }

  const backendOnline =
    state.status?.status === 'ok' ||
    state.status?.status === 'healthy' ||
    state.status?.healthy === true

  return (
    <div className="page">

      {/* HEADER */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">METRICMIND ANALYTICS</p>

          <h1>
            Welcome back,{' '}
            {user?.full_name || user?.username || 'User'}.
          </h1>

          <p className="muted">
            Monitor your business performance and discover insights
            from your data.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="secondary-button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            type="button"
          >
            <RefreshCw
              size={17}
              className={refreshing ? 'spin' : ''}
            />

            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <a className="primary-button" href="/query">
            <Sparkles size={17} />
            Ask MetricMind
          </a>
        </div>
      </div>

      {/* ERROR */}
      <ErrorMessage message={state.error} />

      {/* SYSTEM STATUS */}
      <div
        className="welcome-band"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        <div>
          <span className="kicker">SYSTEM STATUS</span>

          <h2 style={{ marginBottom: '6px' }}>
            Your analytics workspace is ready.
          </h2>

          <p className="muted">
            MetricMind is connected to your business data and ready
            to answer analytical questions.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            fontWeight: 600
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: backendOnline ? '#22c55e' : '#ef4444',
              display: 'inline-block'
            }}
          />

          {backendOnline ? 'Backend Online' : 'Check Backend'}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="metrics-grid">

        <MetricCard
          icon={Database}
          label="Total Revenue"
          value={formatCurrency(kpis.total_sales)}
          detail="Revenue generated from all transactions"
          tone="blue"
        />

        <MetricCard
          icon={Activity}
          label="Total Profit"
          value={formatCurrency(kpis.total_profit)}
          detail="Net profit generated from sales"
          tone="green"
        />

        <MetricCard
          icon={ShoppingCart}
          label="Total Orders"
          value={formatNumber(kpis.total_orders)}
          detail="Number of unique orders"
          tone="amber"
        />

        <MetricCard
          icon={Users}
          label="Total Customers"
          value={formatNumber(kpis.total_customers)}
          detail="Unique customers in your dataset"
          tone="purple"
        />

      </div>

      {/* AI COPILOT */}
      <div className="welcome-band">

        <div>
          <span className="kicker">
            <Sparkles size={14} style={{ marginRight: '5px' }} />
            AI ANALYTICS COPILOT
          </span>

          <h2>
            Ask questions. Get insights. Make better decisions.
          </h2>

          <p>
            Use natural language to explore revenue, profit,
            products, customers, regions and other business metrics.
          </p>
        </div>

        <a
          href="/query"
          className="primary-button"
          style={{ whiteSpace: 'nowrap' }}
        >
          <MessageSquare size={17} />
          Ask a Question
          <ArrowUpRight size={17} />
        </a>

      </div>

      {/* CHARTS */}
      <div className="section-heading">
        <div>
          <p className="eyebrow">PERFORMANCE</p>
          <h2>Business Performance</h2>
          <p className="muted">
            Explore how your sales are distributed across regions
            and products.
          </p>
        </div>
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

      {/* ANALYTICS SUMMARY */}
      <div className="section-grid" style={{ marginTop: '24px' }}>

        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px'
            }}
          >
            <BarChart3 size={22} />
            <div>
              <h3 style={{ margin: 0 }}>Analytics</h3>
              <p className="muted" style={{ margin: 0 }}>
                Available data
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>

            <div>
              <strong>Metrics</strong>
              <p className="muted">
                {Array.isArray(state.metrics)
                  ? state.metrics.length
                  : state.metrics
                    ? Object.keys(state.metrics).length
                    : 0}{' '}
                available metrics
              </p>
            </div>

            <div>
              <strong>Dimensions</strong>
              <p className="muted">
                {Array.isArray(state.dimensions)
                  ? state.dimensions.length
                  : state.dimensions
                    ? Object.keys(state.dimensions).length
                    : 0}{' '}
                available dimensions
              </p>
            </div>

          </div>
        </div>

        <div className="card">

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px'
            }}
          >
            <Server size={22} />

            <div>
              <h3 style={{ margin: 0 }}>
                MetricMind Engine
              </h3>

              <p className="muted" style={{ margin: 0 }}>
                Data intelligence status
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px'
            }}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: backendOnline
                  ? '#22c55e'
                  : '#ef4444'
              }}
            />

            <strong>
              {backendOnline
                ? 'All systems operational'
                : 'Backend connection needs attention'}
            </strong>
          </div>

          <p className="muted">
            Ask MetricMind questions about your business data
            using natural language.
          </p>

          <a
            href="/query"
            className="primary-button"
            style={{
              display: 'inline-flex',
              marginTop: '8px'
            }}
          >
            <Sparkles size={16} />
            Start Analysis
          </a>

        </div>

      </div>

      {/* QUICK ACTIONS */}
      <section className="section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">QUICK ACTIONS</p>
            <h2>What would you like to do?</h2>
          </div>
        </div>

        <div
          className="metrics-grid"
          style={{ marginTop: '16px' }}
        >

          <a
            href="/query"
            className="card"
            style={{
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <Sparkles size={24} />
            <h3>Ask MetricMind</h3>
            <p className="muted">
              Ask questions about revenue, profit, products and
              customers.
            </p>
          </a>

          <a
            href="/analytics"
            className="card"
            style={{
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <BarChart3 size={24} />
            <h3>Explore Analytics</h3>
            <p className="muted">
              Explore detailed business performance and trends.
            </p>
          </a>

          <a
            href="/data"
            className="card"
            style={{
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <Database size={24} />
            <h3>Manage Data</h3>
            <p className="muted">
              View and manage the datasets connected to MetricMind.
            </p>
          </a>

        </div>

      </section>

      {/* FOOTER */}
      <div
        style={{
          textAlign: 'center',
          padding: '30px 0 10px',
          opacity: 0.7
        }}
      >
        <p className="muted">
          MetricMind • AI-powered business intelligence
        </p>
      </div>

    </div>
  )
}