import React, { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  RefreshCw,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Activity,
  AlertCircle,
} from 'lucide-react'

import { apiService } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import './Analytics.css'

/* =========================================================
   HELPERS
========================================================= */

const getPayload = (response) => {
  if (!response) return null
  return response.data ?? response
}

const getNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const cleaned = String(value).replace(/[$,%\s,]/g, '')
  const number = Number(cleaned)

  return Number.isFinite(number) ? number : 0
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(getNumber(value))
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(getNumber(value))
}

/* =========================================================
   REGION NORMALIZER
========================================================= */

const normalizeRegionData = (response) => {
  const payload = getPayload(response)

  console.log('REGION API RAW RESPONSE:', payload)

  if (!payload) return []

  let rows = []

  /* Array directly */
  if (Array.isArray(payload)) {
    rows = payload
  }

  /* Common API wrappers */
  else if (Array.isArray(payload.data)) {
    rows = payload.data
  }

  else if (Array.isArray(payload.results)) {
    rows = payload.results
  }

  else if (Array.isArray(payload.rows)) {
    rows = payload.rows
  }

  else if (Array.isArray(payload.items)) {
    rows = payload.items
  }

  /* Nested region data */
  else if (Array.isArray(payload.regions)) {
    rows = payload.regions
  }

  else if (Array.isArray(payload.region_data)) {
    rows = payload.region_data
  }

  else if (Array.isArray(payload.sales_by_region)) {
    rows = payload.sales_by_region
  }

  /* Object format:
     {
       "West": 710000,
       "East": 680000,
       ...
     }
  */
  else if (
    typeof payload === 'object' &&
    !Array.isArray(payload)
  ) {
    const regionNames = [
      'West',
      'East',
      'Central',
      'South',
    ]

    const objectRows = regionNames
      .filter((region) => payload[region] !== undefined)
      .map((region) => ({
        name: region,
        value: getNumber(payload[region]),
      }))

    if (objectRows.length > 0) {
      console.log('REGION OBJECT FORMAT:', objectRows)
      return objectRows
    }
  }

  const normalized = rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null

      const name =
        row.name ??
        row.region ??
        row.Region ??
        row.label ??
        row.region_name ??
        row.RegionName

      const value =
        row.value ??
        row.revenue ??
        row.sales ??
        row.Sales ??
        row.total ??
        row.amount ??
        row.total_sales ??
        row.total_revenue

      if (!name) return null

      return {
        name: String(name),
        value: getNumber(value),
      }
    })
    .filter(Boolean)

  console.log('REGION NORMALIZED:', normalized)

  return normalized
}

/* =========================================================
   CATEGORY NORMALIZER
========================================================= */

const normalizeCategoryData = (response) => {
  const payload = getPayload(response)

  console.log('CATEGORY API RAW RESPONSE:', payload)

  if (!payload) return []

  let rows = []

  if (Array.isArray(payload)) {
    rows = payload
  } else if (Array.isArray(payload.data)) {
    rows = payload.data
  } else if (Array.isArray(payload.results)) {
    rows = payload.results
  } else if (Array.isArray(payload.rows)) {
    rows = payload.rows
  } else if (Array.isArray(payload.items)) {
    rows = payload.items
  } else if (Array.isArray(payload.categories)) {
    rows = payload.categories
  } else if (Array.isArray(payload.category_data)) {
    rows = payload.category_data
  } else if (Array.isArray(payload.sales_by_category)) {
    rows = payload.sales_by_category
  } else if (
    typeof payload === 'object' &&
    !Array.isArray(payload)
  ) {
    const categoryNames = [
      'Technology',
      'Furniture',
      'Office Supplies',
    ]

    const objectRows = categoryNames
      .filter((category) => payload[category] !== undefined)
      .map((category) => ({
        name: category,
        value: getNumber(payload[category]),
      }))

    if (objectRows.length > 0) {
      return objectRows
    }
  }

  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null

      const name =
        row.name ??
        row.category ??
        row.Category ??
        row.label ??
        row.category_name

      const value =
        row.value ??
        row.revenue ??
        row.sales ??
        row.Sales ??
        row.total ??
        row.amount ??
        row.total_sales ??
        row.total_revenue

      if (!name) return null

      return {
        name: String(name),
        value: getNumber(value),
      }
    })
    .filter(Boolean)
}

/* =========================================================
   TREND NORMALIZER
========================================================= */

const normalizeTrendData = (response) => {
  const payload = getPayload(response)

  if (!payload) return []

  let rows = []

  if (Array.isArray(payload)) {
    rows = payload
  } else if (Array.isArray(payload.data)) {
    rows = payload.data
  } else if (Array.isArray(payload.results)) {
    rows = payload.results
  } else if (Array.isArray(payload.rows)) {
    rows = payload.rows
  } else if (Array.isArray(payload.items)) {
    rows = payload.items
  } else if (Array.isArray(payload.trend)) {
    rows = payload.trend
  }

  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null

      const name =
        row.name ??
        row.month ??
        row.label ??
        row.period ??
        row.date

      const revenue =
        row.revenue ??
        row.sales ??
        row.value ??
        row.total ??
        0

      if (!name) return null

      return {
        name: String(name),
        revenue: getNumber(revenue),
      }
    })
    .filter(Boolean)
}

/* =========================================================
   KPI NORMALIZER
========================================================= */

const normalizeKPIs = (response) => {
  const payload = getPayload(response)

  if (!payload) {
    return {
      revenue: 0,
      profit: 0,
      orders: 0,
      customers: 0,
    }
  }

  const source = payload.data ?? payload

  return {
    revenue: getNumber(
      source.revenue ??
      source.total_revenue ??
      source.sales ??
      0
    ),

    profit: getNumber(
      source.profit ??
      source.total_profit ??
      0
    ),

    orders: getNumber(
      source.orders ??
      source.total_orders ??
      source.order_count ??
      0
    ),

    customers: getNumber(
      source.customers ??
      source.total_customers ??
      source.customer_count ??
      0
    ),
  }
}

/* =========================================================
   FALLBACK DATA
========================================================= */

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
  { name: 'Jan', revenue: 18000 },
  { name: 'Feb', revenue: 23000 },
  { name: 'Mar', revenue: 28000 },
  { name: 'Apr', revenue: 26000 },
  { name: 'May', revenue: 34000 },
  { name: 'Jun', revenue: 39000 },
]

/* =========================================================
   TOOLTIP
========================================================= */

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="analytics-tooltip">
      <strong>{label}</strong>

      <div>
        {formatCurrency(payload[0]?.value)}
      </div>
    </div>
  )
}

/* =========================================================
   ANALYTICS PAGE
========================================================= */

const Analytics = () => {
  const { dark } = useTheme()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [apiOnline, setApiOnline] = useState(false)

  const [metric, setMetric] = useState('revenue')
  const [regionFilter, setRegionFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [kpis, setKpis] = useState({
    revenue: 0,
    profit: 0,
    orders: 0,
    customers: 0,
  })

  const [regionData, setRegionData] =
    useState(DEFAULT_REGIONS)

  const [categoryData, setCategoryData] =
    useState(DEFAULT_CATEGORIES)

  const [trendData, setTrendData] =
    useState(DEFAULT_TREND)

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadAnalytics = async () => {
    try {
      setRefreshing(true)

      const healthResponse =
        await apiService.health()

      if (healthResponse) {
        setApiOnline(true)
      }

      const results = await Promise.allSettled([
        apiService.getDashboardKPIs(),
        apiService.getSalesByRegion(),
        apiService.getSalesByCategory(),
        apiService.getSalesTrend('month'),
      ])

      /* KPI */
      if (results[0].status === 'fulfilled') {
        const newKpis =
          normalizeKPIs(results[0].value)

        setKpis(newKpis)
      }

      /* REGION */
      if (results[1].status === 'fulfilled') {
        const regions =
          normalizeRegionData(results[1].value)

        if (regions.length > 0) {
          setRegionData(regions)
        }

        console.log(
          'MetricMind REGION FINAL:',
          regions
        )
      } else {
        console.error(
          'Region API error:',
          results[1].reason
        )
      }

      /* CATEGORY */
      if (results[2].status === 'fulfilled') {
        const categories =
          normalizeCategoryData(results[2].value)

        if (categories.length > 0) {
          setCategoryData(categories)
        }
      } else {
        console.error(
          'Category API error:',
          results[2].reason
        )
      }

      /* TREND */
      if (results[3].status === 'fulfilled') {
        const trend =
          normalizeTrendData(results[3].value)

        if (trend.length > 0) {
          setTrendData(trend)
        }
      }
    } catch (error) {
      console.error(
        'Analytics loading error:',
        error
      )

      setApiOnline(false)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  /* =======================================================
     FILTER REGION
  ======================================================= */

  const filteredRegionData = useMemo(() => {
    if (regionFilter === 'all') {
      return regionData
    }

    return regionData.filter(
      (item) =>
        item.name.toLowerCase() ===
        regionFilter.toLowerCase()
    )
  }, [regionData, regionFilter])

  /* =======================================================
     FILTER CATEGORY
  ======================================================= */

  const filteredCategoryData = useMemo(() => {
    if (categoryFilter === 'all') {
      return categoryData
    }

    return categoryData.filter(
      (item) =>
        item.name.toLowerCase() ===
        categoryFilter.toLowerCase()
    )
  }, [categoryData, categoryFilter])

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className={`analytics-page ${
        dark
          ? 'analytics-dark'
          : 'analytics-light'
      }`}
    >

      {/* HEADER */}
      <div className="analytics-header">

        <div>
          <div className="analytics-title-row">
            <Activity size={30} />

            <h1>Analytics</h1>
          </div>

          <p>
            Explore your business performance
            and sales insights.
          </p>
        </div>

        <button
          className="analytics-refresh-btn"
          onClick={loadAnalytics}
          disabled={refreshing}
        >
          <RefreshCw
            size={18}
            className={
              refreshing
                ? 'analytics-spin'
                : ''
            }
          />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>

      </div>

      {/* API STATUS */}
      <div
        className={`analytics-api-status ${
          apiOnline
            ? 'online'
            : 'offline'
        }`}
      >
        <span className="analytics-status-dot" />

        {apiOnline
          ? 'Backend API Connected'
          : 'Backend API Offline'}

        {!apiOnline && (
          <span>
            — Start FastAPI on port 8001
          </span>
        )}
      </div>

      {/* FILTERS */}
      <div className="analytics-filter-card">

        <div className="analytics-filter">

          <label>Metric</label>

          <select
            value={metric}
            onChange={(e) =>
              setMetric(e.target.value)
            }
          >
            <option value="revenue">
              Revenue
            </option>

            <option value="profit">
              Profit
            </option>

            <option value="quantity">
              Quantity
            </option>
          </select>

        </div>

        <div className="analytics-filter">

          <label>Region</label>

          <select
            value={regionFilter}
            onChange={(e) =>
              setRegionFilter(e.target.value)
            }
          >
            <option value="all">
              All Regions
            </option>

            {regionData.map((region) => (
              <option
                key={region.name}
                value={region.name}
              >
                {region.name}
              </option>
            ))}
          </select>

        </div>

        <div className="analytics-filter">

          <label>Category</label>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
          >
            <option value="all">
              All Categories
            </option>

            {categoryData.map((category) => (
              <option
                key={category.name}
                value={category.name}
              >
                {category.name}
              </option>
            ))}
          </select>

        </div>

        <div className="analytics-filter-info">
          <TrendingUp size={18} />

          <span>
            Interactive business analytics
          </span>
        </div>

      </div>

      {/* KPI CARDS */}
      <div className="analytics-stats-grid">

        <div className="analytics-stat-card">

          <div className="analytics-stat-icon">
            <DollarSign size={22} />
          </div>

          <div>
            <span>Revenue</span>

            <strong>
              {formatCurrency(kpis.revenue)}
            </strong>
          </div>

        </div>

        <div className="analytics-stat-card">

          <div className="analytics-stat-icon">
            <TrendingUp size={22} />
          </div>

          <div>
            <span>Profit</span>

            <strong>
              {formatCurrency(kpis.profit)}
            </strong>
          </div>

        </div>

        <div className="analytics-stat-card">

          <div className="analytics-stat-icon">
            <ShoppingCart size={22} />
          </div>

          <div>
            <span>Orders</span>

            <strong>
              {formatNumber(kpis.orders)}
            </strong>
          </div>

        </div>

        <div className="analytics-stat-card">

          <div className="analytics-stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Customers</span>

            <strong>
              {formatNumber(kpis.customers)}
            </strong>
          </div>

        </div>

      </div>

      {/* CHARTS */}
      <div className="analytics-chart-grid">

        {/* SALES TREND */}
        <div className="analytics-chart-card analytics-wide">

          <div className="analytics-chart-header">

            <div>
              <h2>Sales Trend</h2>

              <p>
                Monthly revenue performance
              </p>
            </div>

            <TrendingUp size={22} />

          </div>

          <div className="analytics-chart">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart data={trendData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.15}
                />

                <XAxis dataKey="name" />

                <YAxis
                  tickFormatter={(value) =>
                    `$${formatNumber(value)}`
                  }
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3155ff"
                  strokeWidth={4}
                  dot={{
                    r: 5,
                  }}
                  activeDot={{
                    r: 7,
                  }}
                />

              </LineChart>
            </ResponsiveContainer>

          </div>

        </div>

        {/* REGION */}
        <div className="analytics-chart-card">

          <div className="analytics-chart-header">

            <div>
              <h2>Sales by Region</h2>

              <p>
                Regional revenue comparison
              </p>
            </div>

            <Activity size={22} />

          </div>

          <div className="analytics-chart">

            {filteredRegionData.length === 0 ? (

              <div className="analytics-empty">
                <AlertCircle size={32} />

                <span>
                  No region data available
                </span>
              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={filteredRegionData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.15}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    tickFormatter={(value) =>
                      `$${formatNumber(value)}`
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                  <Bar
                    dataKey="value"
                    fill="#3155ff"
                    radius={[
                      8,
                      8,
                      0,
                      0,
                    ]}
                    maxBarSize={70}
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
              <h2>Sales by Category</h2>

              <p>
                Category revenue comparison
              </p>
            </div>

            <DollarSign size={22} />

          </div>

          <div className="analytics-chart">

            {filteredCategoryData.length === 0 ? (

              <div className="analytics-empty">
                <AlertCircle size={32} />

                <span>
                  No category data available
                </span>
              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={filteredCategoryData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.15}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    tickFormatter={(value) =>
                      `$${formatNumber(value)}`
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                  <Bar
                    dataKey="value"
                    fill="#6c63ff"
                    radius={[
                      8,
                      8,
                      0,
                      0,
                    ]}
                    maxBarSize={70}
                  />

                </BarChart>
              </ResponsiveContainer>

            )}

          </div>

        </div>

      </div>

      {/* LOADING */}
      {loading && (
        <div className="analytics-loading">
          Loading analytics...
        </div>
      )}

    </div>
  )
}

export default Analytics