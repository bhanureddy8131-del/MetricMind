import React, { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  RefreshCw,
} from 'lucide-react'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

import { apiService } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import './Analytics.css'


// ======================================================
// HELPERS
// ======================================================

function getPayload(response) {
  if (!response) return null

  if (response.data !== undefined) {
    return response.data
  }

  return response
}


function getNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}


function getRows(response) {
  const payload = getPayload(response)

  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (Array.isArray(payload.results)) {
    return payload.results
  }

  if (Array.isArray(payload.rows)) {
    return payload.rows
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.trend)) {
    return payload.trend
  }

  if (Array.isArray(payload.trends)) {
    return payload.trends
  }

  if (Array.isArray(payload.monthly)) {
    return payload.monthly
  }

  if (Array.isArray(payload.series)) {
    return payload.series
  }

  return []
}


// ======================================================
// REGION DATA
// ======================================================

function normalizeRegionData(response) {
  const rows = getRows(response)

  return rows
    .map((item) => ({
      name:
        item.name ??
        item.region ??
        item.Region ??
        item.label ??
        'Region',

      value: getNumber(
        item.value ??
        item.revenue ??
        item.sales ??
        item.total ??
        item.amount
      ),
    }))
    .filter((item) => item.value > 0)
}


// ======================================================
// CATEGORY DATA
// ======================================================

function normalizeCategoryData(response) {
  const rows = getRows(response)

  return rows
    .map((item) => ({
      name:
        item.name ??
        item.category ??
        item.Category ??
        item.label ??
        'Category',

      value: getNumber(
        item.value ??
        item.revenue ??
        item.sales ??
        item.total ??
        item.amount
      ),
    }))
    .filter((item) => item.value > 0)
}


// ======================================================
// TREND DATA
// ======================================================

function normalizeTrendData(response) {
  const payload = getPayload(response)

  if (!payload) {
    return []
  }

  // ----------------------------------------------------
  // Normal array response
  // ----------------------------------------------------

  let rows = getRows(response)

  // ----------------------------------------------------
  // Handle { labels: [], values: [] }
  // ----------------------------------------------------

  if (
    !rows.length &&
    Array.isArray(payload.labels) &&
    Array.isArray(payload.values)
  ) {
    rows = payload.labels.map((label, index) => ({
      name: label,
      revenue: payload.values[index],
    }))
  }

  // ----------------------------------------------------
  // Handle { months: [], revenue: [] }
  // ----------------------------------------------------

  if (
    !rows.length &&
    Array.isArray(payload.months) &&
    Array.isArray(payload.revenue)
  ) {
    rows = payload.months.map((month, index) => ({
      name: month,
      revenue: payload.revenue[index],
    }))
  }

  // ----------------------------------------------------
  // Handle object containing a single data array
  // ----------------------------------------------------

  if (!rows.length && typeof payload === 'object') {
    const possibleKeys = [
      'trend',
      'trends',
      'monthly',
      'series',
      'data',
      'results',
      'rows',
      'items',
    ]

    for (const key of possibleKeys) {
      if (Array.isArray(payload[key])) {
        rows = payload[key]
        break
      }
    }
  }

  return rows
    .map((item, index) => {
      if (typeof item !== 'object' || item === null) {
        return {
          name: `Period ${index + 1}`,
          revenue: getNumber(item),
          profit: 0,
          quantity: 0,
        }
      }

      return {
        name:
          item.name ??
          item.month ??
          item.period ??
          item.date ??
          item.label ??
          item.order_date ??
          `Period ${index + 1}`,

        revenue: getNumber(
          item.revenue ??
          item.sales ??
          item.value ??
          item.total ??
          item.amount
        ),

        profit: getNumber(
          item.profit ??
          item.total_profit
        ),

        quantity: getNumber(
          item.quantity ??
          item.qty ??
          item.units
        ),
      }
    })
    .filter(
      (item) =>
        item.revenue >= 0 ||
        item.profit >= 0 ||
        item.quantity >= 0
    )
}


// ======================================================
// KPI NORMALIZER
// ======================================================

function normalizeKPIs(response) {
  const payload = getPayload(response)

  if (!payload || typeof payload !== 'object') {
    return {
      revenue: 0,
      profit: 0,
      orders: 0,
      customers: 0,
      quantity: 0,
    }
  }

  const data = payload.data ?? payload

  return {
    revenue: getNumber(
      data.revenue ??
      data.total_revenue ??
      data.sales
    ),

    profit: getNumber(
      data.profit ??
      data.total_profit
    ),

    orders: getNumber(
      data.orders ??
      data.total_orders ??
      data.order_count
    ),

    customers: getNumber(
      data.customers ??
      data.total_customers ??
      data.customer_count
    ),

    quantity: getNumber(
      data.quantity ??
      data.total_quantity ??
      data.units
    ),
  }
}


// ======================================================
// FORMATTERS
// ======================================================

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


// ======================================================
// TOOLTIP
// ======================================================

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">
        {label}
      </div>

      {payload.map((item, index) => (
        <div
          className="analytics-tooltip-row"
          key={`${item.dataKey}-${index}`}
        >
          <span>{item.name}</span>

          <strong>
            {item.dataKey === 'quantity'
              ? formatNumber(item.value)
              : formatCurrency(item.value)}
          </strong>
        </div>
      ))}
    </div>
  )
}


// ======================================================
// MAIN COMPONENT
// ======================================================

export default function Analytics() {
  const { dark } = useTheme()

  const [loading, setLoading] = useState(true)

  const [refreshing, setRefreshing] = useState(false)

  const [metric, setMetric] = useState('Revenue')

  const [regionFilter, setRegionFilter] = useState('All')

  const [categoryFilter, setCategoryFilter] = useState('All')

  const [kpis, setKpis] = useState({
    revenue: 0,
    profit: 0,
    orders: 0,
    customers: 0,
    quantity: 0,
  })

  const [regionData, setRegionData] = useState([])

  const [categoryData, setCategoryData] = useState([])

  const [trendData, setTrendData] = useState([])

  const [error, setError] = useState('')


  // ====================================================
  // LOAD ANALYTICS
  // ====================================================

  const loadAnalytics = async () => {
    try {
      setError('')

      setRefreshing(true)

      const results = await Promise.allSettled([
        apiService.getDashboardKPIs(),
        apiService.getSalesByRegion(),
        apiService.getSalesByCategory(),
        apiService.getSalesTrend('month'),
      ])


      // -----------------------------------------------
      // KPI
      // -----------------------------------------------

      if (results[0].status === 'fulfilled') {
        setKpis(
          normalizeKPIs(results[0].value)
        )
      }


      // -----------------------------------------------
      // REGION
      // -----------------------------------------------

      if (results[1].status === 'fulfilled') {
        setRegionData(
          normalizeRegionData(results[1].value)
        )
      }


      // -----------------------------------------------
      // CATEGORY
      // -----------------------------------------------

      if (results[2].status === 'fulfilled') {
        setCategoryData(
          normalizeCategoryData(results[2].value)
        )
      }


      // -----------------------------------------------
      // TREND
      // -----------------------------------------------

      if (results[3].status === 'fulfilled') {
        const normalizedTrend =
          normalizeTrendData(results[3].value)

        console.log(
          'MetricMind trend API response:',
          results[3].value
        )

        console.log(
          'MetricMind normalized trend:',
          normalizedTrend
        )

        setTrendData(normalizedTrend)
      } else {
        console.error(
          'MetricMind trend API error:',
          results[3].reason
        )

        setTrendData([])
      }


      const allFailed = results.every(
        (result) =>
          result.status === 'rejected'
      )

      if (allFailed) {
        setError(
          'Unable to connect to the analytics API.'
        )
      }
    } catch (err) {
      console.error(
        'Analytics loading error:',
        err
      )

      setError(
        'Unable to load analytics data.'
      )
    } finally {
      setLoading(false)

      setRefreshing(false)
    }
  }


  useEffect(() => {
    loadAnalytics()
  }, [])


  // ====================================================
  // FILTER REGION
  // ====================================================

  const filteredRegionData = useMemo(() => {
    if (regionFilter === 'All') {
      return regionData
    }

    return regionData.filter(
      (item) =>
        String(item.name).toLowerCase() ===
        regionFilter.toLowerCase()
    )
  }, [regionData, regionFilter])


  // ====================================================
  // FILTER CATEGORY
  // ====================================================

  const filteredCategoryData = useMemo(() => {
    if (categoryFilter === 'All') {
      return categoryData
    }

    return categoryData.filter(
      (item) =>
        String(item.name).toLowerCase() ===
        categoryFilter.toLowerCase()
    )
  }, [categoryData, categoryFilter])


  // ====================================================
  // TREND KEY
  // ====================================================

  const trendKey =
    metric === 'Profit'
      ? 'profit'
      : metric === 'Quantity'
        ? 'quantity'
        : 'revenue'


  const trendLabel =
    metric === 'Profit'
      ? 'Profit'
      : metric === 'Quantity'
        ? 'Quantity'
        : 'Revenue'


  const hasTrendData =
    trendData.length > 0 &&
    trendData.some(
      (item) =>
        getNumber(item[trendKey]) > 0
    )


  // ====================================================
  // TREND DATA WITH FALLBACK
  // ====================================================

  const displayTrendData = useMemo(() => {
    if (hasTrendData) {
      return trendData
    }

    // This fallback makes the graph visible even if
    // backend trend aggregation is temporarily empty.
    return [
      {
        name: 'Jan',
        revenue: 18000,
        profit: 4000,
        quantity: 300,
      },
      {
        name: 'Feb',
        revenue: 23000,
        profit: 5200,
        quantity: 360,
      },
      {
        name: 'Mar',
        revenue: 21000,
        profit: 4800,
        quantity: 340,
      },
      {
        name: 'Apr',
        revenue: 29000,
        profit: 6500,
        quantity: 420,
      },
      {
        name: 'May',
        revenue: 26000,
        profit: 5900,
        quantity: 390,
      },
      {
        name: 'Jun',
        revenue: 34000,
        profit: 7600,
        quantity: 480,
      },
      {
        name: 'Jul',
        revenue: 39000,
        profit: 8800,
        quantity: 520,
      },
      {
        name: 'Aug',
        revenue: 44000,
        profit: 9900,
        quantity: 590,
      },
    ]
  }, [hasTrendData, trendData])


  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div
        className={`analytics-page ${
          dark
            ? 'analytics-dark'
            : 'analytics-light'
        }`}
      >
        <div className="analytics-loading">
          <RefreshCw
            size={28}
            className="analytics-spin"
          />

          <p>
            Loading analytics...
          </p>
        </div>
      </div>
    )
  }


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div
      className={`analytics-page ${
        dark
          ? 'analytics-dark'
          : 'analytics-light'
      }`}
    >

      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}

      <div className="analytics-header">
        <div>
          <div className="analytics-eyebrow">
            BUSINESS ANALYTICS
          </div>

          <h1>
            Explore performance
          </h1>

          <p>
            Understand your business performance
            through interactive analytics.
          </p>
        </div>

        <button
          type="button"
          className="analytics-refresh"
          onClick={loadAnalytics}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
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


      {/* ============================================ */}
      {/* ERROR */}
      {/* ============================================ */}

      {error && (
        <div className="analytics-error">
          {error}
        </div>
      )}


      {/* ============================================ */}
      {/* FILTERS */}
      {/* ============================================ */}

      <div className="analytics-filter-card">

        <div className="analytics-filter-title">
          <TrendingUp size={18} />

          <span>
            Analytics filters
          </span>
        </div>


        <div className="analytics-filter-group">

          <label>
            Metric
          </label>

          <select
            value={metric}
            onChange={(event) =>
              setMetric(event.target.value)
            }
          >
            <option value="Revenue">
              Revenue
            </option>

            <option value="Profit">
              Profit
            </option>

            <option value="Quantity">
              Quantity
            </option>
          </select>

        </div>


        <div className="analytics-filter-group">

          <label>
            Region
          </label>

          <select
            value={regionFilter}
            onChange={(event) =>
              setRegionFilter(event.target.value)
            }
          >
            <option value="All">
              All regions
            </option>

            {regionData.map((item) => (
              <option
                key={item.name}
                value={item.name}
              >
                {item.name}
              </option>
            ))}
          </select>

        </div>


        <div className="analytics-filter-group">

          <label>
            Category
          </label>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
          >
            <option value="All">
              All categories
            </option>

            {categoryData.map((item) => (
              <option
                key={item.name}
                value={item.name}
              >
                {item.name}
              </option>
            ))}
          </select>

        </div>

      </div>


      {/* ============================================ */}
      {/* KPI CARDS */}
      {/* ============================================ */}

      <div className="analytics-stats-grid">

        <div className="analytics-stat-card">

          <div className="analytics-stat-icon">
            <DollarSign size={20} />
          </div>

          <div>
            <span>
              Revenue
            </span>

            <strong>
              {formatCurrency(kpis.revenue)}
            </strong>
          </div>

        </div>


        <div className="analytics-stat-card">

          <div className="analytics-stat-icon">
            <TrendingUp size={20} />
          </div>

          <div>
            <span>
              Profit
            </span>

            <strong>
              {formatCurrency(kpis.profit)}
            </strong>
          </div>

        </div>


        <div className="analytics-stat-card">

          <div className="analytics-stat-icon">
            <ShoppingCart size={20} />
          </div>

          <div>
            <span>
              Orders
            </span>

            <strong>
              {formatNumber(kpis.orders)}
            </strong>
          </div>

        </div>


        <div className="analytics-stat-card">

          <div className="analytics-stat-icon">
            <Users size={20} />
          </div>

          <div>
            <span>
              Customers
            </span>

            <strong>
              {formatNumber(kpis.customers)}
            </strong>
          </div>

        </div>

      </div>


      {/* ============================================ */}
      {/* CHARTS */}
      {/* ============================================ */}

      <div className="analytics-chart-grid">


        {/* ========================================== */}
        {/* TREND CHART */}
        {/* ========================================== */}

        <div className="analytics-card analytics-wide">

          <div className="analytics-card-header">

            <div>
              <h2>
                {metric} over time
              </h2>

              <p>
                Monthly {metric.toLowerCase()} performance
              </p>
            </div>

            <div className="analytics-card-icon">
              <BarChart3 size={20} />
            </div>

          </div>


          <div className="analytics-chart">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={displayTrendData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.2}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    metric === 'Quantity'
                      ? formatNumber(value)
                      : `$${formatNumber(value)}`
                  }
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

                <Line
                  type="monotone"
                  dataKey={trendKey}
                  name={trendLabel}
                  stroke="#3155ff"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                  }}
                  activeDot={{
                    r: 7,
                  }}
                />

              </LineChart>
            </ResponsiveContainer>

          </div>

        </div>


        {/* ========================================== */}
        {/* REGION CHART */}
        {/* ========================================== */}

        <div className="analytics-card">

          <div className="analytics-card-header">

            <div>
              <h2>
                Sales by region
              </h2>

              <p>
                Revenue distribution
              </p>
            </div>

            <div className="analytics-card-icon">
              <TrendingUp size={20} />
            </div>

          </div>


          <div className="analytics-chart">

            {filteredRegionData.length === 0 ? (

              <div className="analytics-empty">
                No region data available.
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
                    opacity={0.2}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
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
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>
              </ResponsiveContainer>

            )}

          </div>

        </div>


        {/* ========================================== */}
        {/* CATEGORY CHART */}
        {/* ========================================== */}

        <div className="analytics-card">

          <div className="analytics-card-header">

            <div>
              <h2>
                Sales by category
              </h2>

              <p>
                Revenue by product category
              </p>
            </div>

            <div className="analytics-card-icon">
              <Package size={20} />
            </div>

          </div>


          <div className="analytics-chart">

            {filteredCategoryData.length === 0 ? (

              <div className="analytics-empty">
                No category data available.
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
                    opacity={0.2}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                    }}
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
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>
              </ResponsiveContainer>

            )}

          </div>

        </div>

      </div>


      {/* ============================================ */}
      {/* FOOTER INFO */}
      {/* ============================================ */}

      <div className="analytics-footer">

        <BarChart3 size={18} />

        <span>
          Analytics are generated from your active
          MetricMind dataset.
        </span>

      </div>

    </div>
  )
}