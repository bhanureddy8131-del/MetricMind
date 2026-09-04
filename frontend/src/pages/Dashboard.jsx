import { useEffect, useState } from 'react'
import { Activity, ArrowUpRight, Database, Layers3, MessageSquare, Sparkles } from 'lucide-react'
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [status, kpis, metrics, dimensions, regionData, topProducts] = await Promise.all([
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
          status: status.data,
          kpis: kpis.data,
          metrics: metrics.data,
          dimensions: dimensions.data,
          salesByRegion: regionData.data,
          topProducts: topProducts.data
        })
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message
        }))
      }
    }

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

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Good morning, {user?.full_name || user?.username}.</h1>
          <p className="muted">A live pulse check of your MetricMind workspace.</p>
        </div>
        <a className="primary-button" href="/query">
          <Sparkles size={17} /> Ask a question
        </a>
      </div>

      <ErrorMessage message={state.error} />

      <div className="metrics-grid">
        <MetricCard
          icon={Database}
          label="Total Sales"
          value={`$${(kpis.total_sales || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          detail="Revenue from all transactions"
          tone="blue"
        />
        <MetricCard
          icon={Activity}
          label="Total Profit"
          value={`$${(kpis.total_profit || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          detail="Net profit after costs"
          tone="green"
        />
        <MetricCard
          icon={MessageSquare}
          label="Total Orders"
          value={(kpis.total_orders || 0).toLocaleString()}
          detail="Number of unique orders"
          tone="amber"
        />
        <MetricCard
          icon={Layers3}
          label="Total Customers"
          value={(kpis.total_customers || 0).toLocaleString()}
          detail="Unique customer count"
          tone="purple"
        />
      </div>

      <div className="welcome-band">
        <div>
          <span className="kicker">YOUR ANALYTICS COPILOT</span>
          <h2>Turn a business question into a confident next move.</h2>
          <p>MetricMind connects natural language, governed SQL, and decision-ready visuals.</p>
        </div>
        <ArrowUpRight size={26} />
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

      <section className="section">
        <h3>Next Steps</h3>
        <ul>
          <li><strong>Ask MetricMind:</strong> Use natural language to query your data</li>
          <li><strong>Explore Analytics:</strong> Dive into regional and category performance</li>
          <li><strong>Manage Data:</strong> Upload datasets and manage records</li>
        </ul>
      </section>
    </div>
  )
}
