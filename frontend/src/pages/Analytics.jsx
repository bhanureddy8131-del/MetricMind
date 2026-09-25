import React, { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Activity,
  RefreshCw,
  ArrowUpRight,
  Database,
  CircleDollarSign,
} from 'lucide-react'

import { apiService } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import './Analytics.css'

const COLORS = ['#3155ff', '#6c63ff', '#00b8d9', '#8b5cf6', '#14b8a6']

const DEFAULT_REGIONS = [
  { name: 'West', value: 0 },
  { name: 'East', value: 0 },
  { name: 'Central', value: 0 },
  { name: 'South', value: 0 },
]

const DEFAULT_CATEGORIES = [
  { name: 'Technology', value: 0 },
  { name: 'Furniture', value: 0 },
  { name: 'Office Supplies', value: 0 },
]

const DEFAULT_TREND = [
  { name: 'Jan', revenue: 0 },
  { name: 'Feb', revenue: 0 },
  { name: 'Mar', revenue: 0 },
  { name: 'Apr', revenue: 0 },
  { name: 'May', revenue: 0 },
  { name: 'Jun', revenue: 0 },
]

function getPayload(response) {
  return response?.data?.data ?? response?.data ?? response ?? []
}

function getNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(getNumber(value))
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(getNumber(value))
}

function normalizeRegionData(response) {
  const payload = getPayload(response)

  if (!Array.isArray(payload) || payload.length === 0) {
    return DEFAULT_REGIONS
  }

  return payload.map((item) => ({
    name: item.region ?? item.name ?? 'Unknown',
    value: getNumber(item.sales ?? item.value ?? item.revenue),
  }))
}

function normalizeCategoryData(response) {
  const payload = getPayload(response)

  if (!Array.isArray(payload) || payload.length === 0) {
    return DEFAULT_CATEGORIES
  }

  return payload.map((item) => ({
    name: item.category ?? item.name ?? 'Unknown',
    value: getNumber(item.sales ?? item.value ?? item.revenue),
  }))
}

function normalizeTrendData(response) {
  const payload = getPayload(response)

  if (!Array.isArray(payload) || payload.length === 0) {
    return DEFAULT_TREND
  }

  return payload.map((item) => ({
    name: item.name ?? item.period ?? item.date ?? 'Unknown',
    revenue: getNumber(
      item.revenue ??
        item.sales ??
        item.value ??
        item.total
    ),
  }))
}

function normalizeKPIs(response) {
  const data = response?.data?.data ?? response?.data ?? response ?? {}

  return {
    revenue: getNumber(data.revenue),
    profit: getNumber(data.profit),
    orders: getNumber(data.orders),
    customers: getNumber(data.customers),
  }
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="analytics-tooltip">
      <div className="tooltip-label">{label}</div>

      {payload.map((entry, index) => (
        <div className="tooltip-row" key={index}>
          <span>{entry.name || 'Value'}</span>
          <strong>
            {formatCurrency(entry.value)}
          </strong>
        </div>
      ))}
    </div>
  )
}

function Analytics() {
  const { dark } = useTheme()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [apiOnline, setApiOnline] = useState(false)

  const [kpis, setKpis] = useState({
    revenue: 0,
    profit: 0,
    orders: 0,
    customers: 0,
  })

  const [regions, setRegions] = useState(DEFAULT_REGIONS)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [trend, setTrend] = useState(DEFAULT_TREND)

  const [regionFilter, setRegionFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [metricFilter, setMetricFilter] = useState('Revenue')

  const loadAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const healthResponse = await apiService.health()

      setApiOnline(
        healthResponse?.status === 200 ||
        healthResponse?.data?.status === 'ok' ||
        healthResponse?.data?.status === 'healthy'
      )

      const [
        kpiResponse,
        regionResponse,
        categoryResponse,
        trendResponse,
      ] = await Promise.allSettled([
        apiService.getDashboardKPIs(),
        apiService.getSalesByRegion(),
        apiService.getSalesByCategory(),
        apiService.getSalesTrend('month'),
      ])

      if (kpiResponse.status === 'fulfilled') {
        setKpis(normalizeKPIs(kpiResponse.value))
      }

      if (regionResponse.status === 'fulfilled') {
        setRegions(normalizeRegionData(regionResponse.value))
      }

      if (categoryResponse.status === 'fulfilled') {
        setCategories(normalizeCategoryData(categoryResponse.value))
      }

      if (trendResponse.status === 'fulfilled') {
        setTrend(normalizeTrendData(trendResponse.value))
      }
    } catch (error) {
      console.error('Analytics loading error:', error)
      setApiOnline(false)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const filteredRegions = useMemo(() => {
    if (regionFilter === 'All') {
      return regions
    }

    return regions.filter(
      (item) => item.name === regionFilter
    )
  }, [regions, regionFilter])

  const filteredCategories = useMemo(() => {
    if (categoryFilter === 'All') {
      return categories
    }

    return categories.filter(
      (item) => item.name === categoryFilter
    )
  }, [categories, categoryFilter])

  const categoryTotal = categories.reduce(
    (sum, item) => sum + getNumber(item.value),
    0
  )

  return (
    <div className={`analytics-page ${dark ? 'analytics-dark' : 'analytics-light'}`}>

      {/* HEADER */}
      <div className="analytics-header">

        <div className="analytics-heading">
          <div className="analytics-title-icon">
            <BarChart3 size={26} />
          </div>

          <div>
            <div className="analytics-eyebrow">
              METRICMIND INTELLIGENCE
            </div>

            <h1>Analytics</h1>

            <p>
              Explore your business performance through live data insights.
            </p>
          </div>
        </div>

        <div className="analytics-header-actions">

          <div className={`api-status ${apiOnline ? 'online' : 'offline'}`}>
            <span className="status-dot"></span>

            <span>
              {apiOnline ? 'Live Data' : 'Offline'}
            </span>
          </div>

          <button
            className="refresh-button"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? 'spin' : ''}
            />

            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>

        </div>
      </div>

      {/* KPI CARDS */}
      <section className="kpi-grid">

        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <div className="kpi-icon">
              <DollarSign size={21} />
            </div>

            <span className="kpi-badge">
              Revenue
            </span>
          </div>

          <div className="kpi-value">
            {loading ? '—' : formatCurrency(kpis.revenue)}
          </div>

          <div className="kpi-bottom">
            <TrendingUp size={15} />
            <span>Total sales generated</span>
          </div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-top">
            <div className="kpi-icon">
              <CircleDollarSign size={21} />
            </div>

            <span className="kpi-badge">
              Profit
            </span>
          </div>

          <div className="kpi-value">
            {loading ? '—' : formatCurrency(kpis.profit)}
          </div>

          <div className="kpi-bottom">
            <TrendingUp size={15} />
            <span>Net business profit</span>
          </div>
        </div>

        <div className="kpi-card kpi-cyan">
          <div className="kpi-top">
            <div className="kpi-icon">
              <ShoppingCart size={21} />
            </div>

            <span className="kpi-badge">
              Orders
            </span>
          </div>

          <div className="kpi-value">
            {loading ? '—' : formatNumber(kpis.orders)}
          </div>

          <div className="kpi-bottom">
            <Activity size={15} />
            <span>Total unique orders</span>
          </div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-top">
            <div className="kpi-icon">
              <Users size={21} />
            </div>

            <span className="kpi-badge">
              Customers
            </span>
          </div>

          <div className="kpi-value">
            {loading ? '—' : formatNumber(kpis.customers)}
          </div>

          <div className="kpi-bottom">
            <Users size={15} />
            <span>Unique customers</span>
          </div>
        </div>

      </section>

      {/* FILTER BAR */}
      <section className="analytics-toolbar">

        <div className="toolbar-left">
          <div className="toolbar-icon">
            <Activity size={18} />
          </div>

          <div>
            <strong>Performance Explorer</strong>
            <span>Filter and analyze your dataset</span>
          </div>
        </div>

        <div className="filters">

          <label>
            <span>Region</span>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="All">All regions</option>

              {regions.map((item) => (
                <option
                  key={item.name}
                  value={item.name}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Category</span>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All categories</option>

              {categories.map((item) => (
                <option
                  key={item.name}
                  value={item.name}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Metric</span>

           <select
  value={metricFilter}
  onChange={(e) => setMetricFilter(e.target.value)}
>
  <option value="Revenue">Revenue</option>
  <option value="Profit">Profit</option>
  <option value="Orders">Orders</option>
  <option value="Customers">Customers</option>
</select>
          </label>

        </div>
      </section>

      {/* MAIN CHART GRID */}
      <section className="chart-grid">

        {/* REVENUE TREND */}
        <div className="chart-card chart-wide">

          <div className="chart-header">

            <div>
              <div className="chart-title-row">
                <div className="chart-small-icon blue">
                  <TrendingUp size={18} />
                </div>

                <h2>Revenue Trend</h2>
              </div>

              <p>Monthly revenue performance</p>
            </div>

            <div className="chart-action">
              <ArrowUpRight size={17} />
            </div>

          </div>

          <div className="chart-content">

            <ResponsiveContainer width="100%" height={330}>
              <AreaChart data={trend}>

                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#3155ff"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="100%"
                      stopColor="#3155ff"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={dark ? '#273354' : '#e8ebf5'}
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    `$${formatNumber(value / 1000)}k`
                  }
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#3155ff"
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                  activeDot={{
                    r: 6,
                    strokeWidth: 3,
                  }}
                />

              </AreaChart>
            </ResponsiveContainer>

          </div>
        </div>

        {/* REGION */}
        <div className="chart-card">

          <div className="chart-header">

            <div>
              <div className="chart-title-row">
                <div className="chart-small-icon purple">
                  <BarChart3 size={18} />
                </div>

                <h2>Sales by Region</h2>
              </div>

              <p>Revenue distribution by region</p>
            </div>

            <div className="mini-total">
              {formatCurrency(
                regions.reduce(
                  (sum, item) => sum + item.value,
                  0
                )
              )}
            </div>

          </div>

          <div className="chart-content">

            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={filteredRegions}
                margin={{
                  top: 10,
                  right: 5,
                  left: -15,
                  bottom: 0,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={dark ? '#273354' : '#e8ebf5'}
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    `$${formatNumber(value / 1000)}k`
                  }
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

                <Bar
                  dataKey="value"
                  name="Sales"
                  fill="#3155ff"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={58}
                />

              </BarChart>
            </ResponsiveContainer>

          </div>
        </div>

        {/* CATEGORY */}
        <div className="chart-card">

          <div className="chart-header">

            <div>
              <div className="chart-title-row">
                <div className="chart-small-icon cyan">
                  <Database size={18} />
                </div>

                <h2>Sales by Category</h2>
              </div>

              <p>Revenue contribution by category</p>
            </div>

            <div className="mini-total">
              {formatCurrency(categoryTotal)}
            </div>

          </div>

          <div className="category-content">

            <div className="pie-wrapper">

              <ResponsiveContainer width="100%" height={245}>
                <PieChart>

                  <Pie
                    data={filteredCategories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {filteredCategories.map((_, index) => (
                      <Cell
                        key={`category-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                </PieChart>
              </ResponsiveContainer>

              <div className="pie-center">
                <strong>
                  {formatCurrency(categoryTotal)}
                </strong>

                <span>Total</span>
              </div>

            </div>

            <div className="category-legend">

              {filteredCategories.map((item, index) => {

                const percentage =
                  categoryTotal > 0
                    ? (item.value / categoryTotal) * 100
                    : 0

                return (
                  <div
                    className="legend-item"
                    key={item.name}
                  >

                    <div className="legend-main">

                      <span
                        className="legend-dot"
                        style={{
                          background:
                            COLORS[index % COLORS.length],
                        }}
                      />

                      <span className="legend-name">
                        {item.name}
                      </span>

                    </div>

                    <div className="legend-values">
                      <strong>
                        {formatCurrency(item.value)}
                      </strong>

                      <span>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>

                  </div>
                )
              })}

            </div>
          </div>
        </div>

      </section>

      {/* FOOTER INSIGHT */}
      <div className="analytics-footer">

        <div className="footer-icon">
          <Activity size={19} />
        </div>

        <div>
          <strong>MetricMind Analytics Engine</strong>

          <span>
            Your charts are connected to the live MetricMind dataset.
          </span>
        </div>

        <div className="footer-live">
          <span className="status-dot"></span>
          {apiOnline ? 'Connected' : 'Disconnected'}
        </div>

      </div>

    </div>
  )
}

export default Analytics