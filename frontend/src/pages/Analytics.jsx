import { useEffect, useMemo, useState } from 'react'

import {
  Activity,
  BarChart3,
  Filter,
  PieChart,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
} from 'lucide-react'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { apiService } from '../services/api'
import { useTheme } from '../context/ThemeContext'

import './Analytics.css'


const COLORS = [
  '#3155ff',
  '#7c3aed',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
]


function getPayload(response) {
  if (!response) return null

  if (response.data !== undefined) {
    return response.data
  }

  return response
}


function getRows(response) {
  const payload = getPayload(response)

  if (Array.isArray(payload)) {
    return payload
  }

  if (payload?.data && Array.isArray(payload.data)) {
    return payload.data
  }

  if (payload?.results && Array.isArray(payload.results)) {
    return payload.results
  }

  if (payload?.rows && Array.isArray(payload.rows)) {
    return payload.rows
  }

  return []
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
  const rows = getRows(response)

  return rows
    .map((item) => ({
      name:
        item.name ||
        item.region ||
        item.Region ||
        item.label ||
        'Unknown',

      value: getNumber(
        item.value ??
          item.revenue ??
          item.sales ??
          item.total ??
          item.amount
      ),
    }))
    .filter((item) => item.value >= 0)
}


function normalizeCategoryData(response) {
  const rows = getRows(response)

  return rows
    .map((item) => ({
      name:
        item.name ||
        item.category ||
        item.Category ||
        item.label ||
        'Unknown',

      value: getNumber(
        item.value ??
          item.revenue ??
          item.sales ??
          item.total ??
          item.amount
      ),
    }))
    .filter((item) => item.value >= 0)
}


function normalizeTrendData(response) {
  const rows = getRows(response)

  return rows
    .map((item) => ({
      name:
        item.name ||
        item.month ||
        item.period ||
        item.label ||
        'Period',

      revenue: getNumber(
        item.revenue ??
          item.sales ??
          item.value ??
          item.total
      ),
    }))
    .filter((item) => item.revenue >= 0)
}


function getKpi(data, keys) {
  if (!data) return 0

  for (const key of keys) {
    if (
      data[key] !== undefined &&
      data[key] !== null
    ) {
      return getNumber(data[key])
    }
  }

  return 0
}


function StatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div className="analytics-stat-card">

      <div className="analytics-stat-top">

        <div className="analytics-stat-icon">
          {icon}
        </div>

        <div className="analytics-stat-live">
          <span />
          Live
        </div>

      </div>

      <div className="analytics-stat-title">
        {title}
      </div>

      <div className="analytics-stat-value">
        {value}
      </div>

      <div className="analytics-stat-subtitle">
        {subtitle}
      </div>

    </div>
  )
}


function Analytics() {

  const { dark } = useTheme()

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [kpis, setKpis] = useState({
    revenue: 0,
    profit: 0,
    orders: 0,
    customers: 0,
  })

  const [regionData, setRegionData] = useState([])

  const [categoryData, setCategoryData] = useState([])

  const [trendData, setTrendData] = useState([])

  const [metric, setMetric] = useState('Revenue')

  const [regionFilter, setRegionFilter] =
    useState('All regions')

  const [categoryFilter, setCategoryFilter] =
    useState('All categories')


  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: dark
        ? '#111827'
        : '#ffffff',

      border: dark
        ? '1px solid #263244'
        : '1px solid #e5e7eb',

      borderRadius: '12px',

      color: dark
        ? '#ffffff'
        : '#111827',

      boxShadow:
        '0 10px 30px rgba(20, 35, 90, 0.12)',
    }),
    [dark]
  )


  async function loadAnalytics() {

    setLoading(true)
    setError('')

    try {

      const results =
        await Promise.allSettled([
          apiService.getDashboardKPIs(),
          apiService.getSalesByRegion(),
          apiService.getSalesByCategory(),
          apiService.getSalesTrend('month'),
        ])


      if (results[0].status === 'fulfilled') {

        const data =
          getPayload(results[0].value)

        setKpis({
          revenue: getKpi(data, [
            'revenue',
            'total_revenue',
            'totalRevenue',
            'sales',
          ]),

          profit: getKpi(data, [
            'profit',
            'total_profit',
            'totalProfit',
          ]),

          orders: getKpi(data, [
            'orders',
            'total_orders',
            'totalOrders',
          ]),

          customers: getKpi(data, [
            'customers',
            'total_customers',
            'totalCustomers',
          ]),
        })

      } else {
        setError(
          'Could not load KPI data.'
        )
      }


      if (results[1].status === 'fulfilled') {

        setRegionData(
          normalizeRegionData(
            results[1].value
          )
        )

      }


      if (results[2].status === 'fulfilled') {

        setCategoryData(
          normalizeCategoryData(
            results[2].value
          )
        )

      }


      if (results[3].status === 'fulfilled') {

        setTrendData(
          normalizeTrendData(
            results[3].value
          )
        )

      }

    } catch (err) {

      console.error(
        'Analytics loading error:',
        err
      )

      setError(
        'Analytics data could not be loaded.'
      )

    } finally {

      setLoading(false)

    }
  }


  useEffect(() => {
    loadAnalytics()
  }, [])


  const filteredRegionData =
    regionFilter === 'All regions'
      ? regionData
      : regionData.filter(
          (item) =>
            item.name === regionFilter
        )


  const filteredCategoryData =
    categoryFilter === 'All categories'
      ? categoryData
      : categoryData.filter(
          (item) =>
            item.name === categoryFilter
        )


  return (
    <div
      className={
        dark
          ? 'analytics-page analytics-dark'
          : 'analytics-page analytics-light'
      }
    >

      {/* HEADER */}

      <section className="analytics-header">

        <div>

          <div className="analytics-eyebrow">
            BUSINESS ANALYTICS
          </div>

          <h1>
            Explore performance.
          </h1>

          <p>
            Analyze your business performance
            using real MetricMind data.
          </p>

        </div>


        <button
          className="analytics-refresh-button"
          onClick={loadAnalytics}
          disabled={loading}
        >

          <RefreshCw
            size={17}
            className={
              loading ? 'analytics-spin' : ''
            }
          />

          {loading
            ? 'Refreshing'
            : 'Refresh'}

        </button>

      </section>


      {/* ERROR */}

      {error && (
        <div className="analytics-notice">

          <Activity size={17} />

          <span>
            {error}
          </span>

        </div>
      )}


      {/* FILTER BAR */}

      <section className="analytics-filter-card">

        <div className="analytics-filter-title">

          <Filter size={18} />

          <div>
            <strong>
              Analysis filters
            </strong>

            <span>
              Refine your business view
            </span>
          </div>

        </div>


        <div className="analytics-filter-controls">

          <div className="analytics-filter">

            <label>
              Metric
            </label>

            <select
              value={metric}
              onChange={(event) =>
                setMetric(
                  event.target.value
                )
              }
            >
              <option>
                Revenue
              </option>

              <option>
                Profit
              </option>

              <option>
                Quantity
              </option>

            </select>

          </div>


          <div className="analytics-filter">

            <label>
              Region
            </label>

            <select
              value={regionFilter}
              onChange={(event) =>
                setRegionFilter(
                  event.target.value
                )
              }
            >

              <option>
                All regions
              </option>

              {regionData.map(
                (item) => (
                  <option
                    key={item.name}
                    value={item.name}
                  >
                    {item.name}
                  </option>
                )
              )}

            </select>

          </div>


          <div className="analytics-filter">

            <label>
              Category
            </label>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
            >

              <option>
                All categories
              </option>

              {categoryData.map(
                (item) => (
                  <option
                    key={item.name}
                    value={item.name}
                  >
                    {item.name}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

      </section>


      {/* KPI CARDS */}

      <section className="analytics-stats-grid">

        <StatCard
          icon={
            <DollarSign size={21} />
          }
          title="TOTAL REVENUE"
          value={formatCurrency(
            kpis.revenue
          )}
          subtitle="Current business revenue"
        />


        <StatCard
          icon={
            <TrendingUp size={21} />
          }
          title="TOTAL PROFIT"
          value={formatCurrency(
            kpis.profit
          )}
          subtitle="Profit generated"
        />


        <StatCard
          icon={
            <ShoppingCart size={21} />
          }
          title="TOTAL ORDERS"
          value={formatNumber(
            kpis.orders
          )}
          subtitle="Orders processed"
        />


        <StatCard
          icon={
            <Users size={21} />
          }
          title="CUSTOMERS"
          value={formatNumber(
            kpis.customers
          )}
          subtitle="Unique customers"
        />

      </section>


      {/* MAIN CHARTS */}

      <section className="analytics-chart-grid">

        {/* TREND */}

        <div className="analytics-chart-card analytics-wide">

          <div className="analytics-chart-header">

            <div>

              <div className="analytics-chart-title">

                <TrendingUp size={17} />

                Revenue over time

              </div>

              <p>
                Monthly revenue performance
              </p>

            </div>

            <span className="analytics-chart-badge">
              {metric}
            </span>

          </div>


          <div className="analytics-chart">

            {trendData.length === 0 ? (

              <div className="analytics-empty">
                No trend data available.
              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={trendData}
                  margin={{
                    top: 10,
                    right: 15,
                    left: 5,
                    bottom: 5,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={
                      dark
                        ? '#273449'
                        : '#e9edf5'
                    }
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: dark
                        ? '#a7b0c0'
                        : '#667085',
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: dark
                        ? '#a7b0c0'
                        : '#667085',
                      fontSize: 12,
                    }}
                    tickFormatter={(value) =>
                      `$${Math.round(
                        value / 1000
                      )}k`
                    }
                  />

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                    formatter={(value) => [
                      formatCurrency(value),
                      'Revenue',
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3155ff"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            )}

          </div>

        </div>


        {/* REGION */}

        <div className="analytics-chart-card">

          <div className="analytics-chart-header">

            <div>

              <div className="analytics-chart-title">

                <BarChart3 size={17} />

                Performance by region

              </div>

              <p>
                Revenue distribution
              </p>

            </div>

          </div>


          <div className="analytics-chart">

            {filteredRegionData.length === 0 ? (

              <div className="analytics-empty">
                No regional data available.
              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={filteredRegionData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 15,
                    left: 5,
                    bottom: 5,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke={
                      dark
                        ? '#273449'
                        : '#e9edf5'
                    }
                  />

                  <XAxis
                    type="number"
                    hide
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={75}
                    tick={{
                      fill: dark
                        ? '#d0d5dd'
                        : '#667085',
                      fontSize: 12,
                    }}
                  />

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                    formatter={(value) => [
                      formatCurrency(value),
                      'Revenue',
                    ]}
                  />

                  <Bar
                    dataKey="value"
                    fill="#3155ff"
                    radius={[
                      0,
                      8,
                      8,
                      0,
                    ]}
                    barSize={25}
                  />

                </BarChart>

              </ResponsiveContainer>

            )}

          </div>

        </div>


        {/* CATEGORY */}

        <div className="analytics-chart-card">

          <div className="analytics-chart-header">

            <div>

              <div className="analytics-chart-title">

                <PieChart size={17} />

                Category mix

              </div>

              <p>
                Revenue contribution
              </p>

            </div>

          </div>


          <div className="analytics-category-layout">

            <div className="analytics-pie">

              {filteredCategoryData.length === 0 ? (

                <div className="analytics-empty">
                  No category data available.
                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <RechartsPieChart>

                    <Pie
                      data={
                        filteredCategoryData
                      }
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={88}
                      paddingAngle={3}
                    >

                      {filteredCategoryData.map(
                        (_, index) => (

                          <Cell
                            key={index}
                            fill={
                              COLORS[
                                index %
                                  COLORS.length
                              ]
                            }
                          />

                        )
                      )}

                    </Pie>

                    <Tooltip
                      contentStyle={
                        tooltipStyle
                      }
                    />

                  </RechartsPieChart>

                </ResponsiveContainer>

              )}

            </div>


            <div className="analytics-category-list">

              {filteredCategoryData.map(
                (item, index) => (

                  <div
                    className="analytics-category-row"
                    key={
                      item.name +
                      index
                    }
                  >

                    <div>

                      <span
                        className="analytics-category-dot"
                        style={{
                          background:
                            COLORS[
                              index %
                                COLORS.length
                            ],
                        }}
                      />

                      <span>
                        {item.name}
                      </span>

                    </div>

                    <strong>
                      {formatCurrency(
                        item.value
                      )}
                    </strong>

                  </div>

                )
              )}

            </div>

          </div>

        </div>


        {/* INSIGHT */}

        <div className="analytics-insight-card">

          <div className="analytics-insight-icon">
            <BarChart3 size={22} />
          </div>

          <div>

            <span>
              METRICMIND ANALYTICS
            </span>

            <h2>
              Your business at a glance.
            </h2>

            <p>
              Use the filters above to explore
              revenue, regional performance and
              category contribution from your
              connected business dataset.
            </p>

          </div>

        </div>

      </section>


      {/* FOOTER */}

      <footer className="analytics-footer">

        <span>
          © 2026 MetricMind
        </span>

        <span>
          AI-Powered Business Intelligence
        </span>

        <span>
          ● Analytics connected
        </span>

      </footer>

    </div>
  )
}


export default Analytics