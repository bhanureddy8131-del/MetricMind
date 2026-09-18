import { useEffect, useMemo, useState } from 'react'

import {
  Activity,
  BarChart3,
  Bell,
  ChevronRight,
  Database,
  FileBarChart,
  Home,
  Moon,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Sun,
  TrendingUp,
  Upload,
  Users,
  X,
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

import { Link, useNavigate } from 'react-router-dom'

import { apiService } from '../services/api'
import { useTheme } from '../context/ThemeContext'

import './Dashboard.css'


const fallbackRegion = [
  { name: 'West', value: 42000 },
  { name: 'East', value: 35000 },
  { name: 'Central', value: 28000 },
  { name: 'South', value: 22000 },
]

const fallbackCategory = [
  { name: 'Technology', value: 35 },
  { name: 'Furniture', value: 30 },
  { name: 'Office Supplies', value: 25 },
  { name: 'Other', value: 10 },
]

const fallbackTrend = [
  { name: 'Jan', revenue: 18000 },
  { name: 'Feb', revenue: 23000 },
  { name: 'Mar', revenue: 21000 },
  { name: 'Apr', revenue: 29000 },
  { name: 'May', revenue: 26000 },
  { name: 'Jun', revenue: 34000 },
  { name: 'Jul', revenue: 39000 },
  { name: 'Aug', revenue: 44000 },
]

const fallbackProducts = [
  { name: 'Product A', value: 12400 },
  { name: 'Product B', value: 9800 },
  { name: 'Product C', value: 8700 },
  { name: 'Product D', value: 7900 },
  { name: 'Product E', value: 7100 },
]


function getNumber(value, fallback = 0) {
  const number = Number(value)

  if (Number.isFinite(number)) {
    return number
  }

  return fallback
}


function formatCurrency(value) {
  const number = getNumber(value)

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(number)
}


function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(getNumber(value))
}


function getPayload(response) {
  if (!response) {
    return null
  }

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

  if (payload && Array.isArray(payload.data)) {
    return payload.data
  }

  if (payload && Array.isArray(payload.results)) {
    return payload.results
  }

  if (payload && Array.isArray(payload.rows)) {
    return payload.rows
  }

  return []
}


function normalizeRegionData(response) {
  const rows = getRows(response)

  if (!rows.length) {
    return fallbackRegion
  }

  const result = rows
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
    .filter((item) => item.value > 0)

  return result.length ? result : fallbackRegion
}


function normalizeCategoryData(response) {
  const rows = getRows(response)

  if (!rows.length) {
    return fallbackCategory
  }

  const result = rows
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
    .filter((item) => item.value > 0)

  return result.length ? result : fallbackCategory
}


function normalizeTrendData(response) {
  const rows = getRows(response)

  if (!rows.length) {
    return fallbackTrend
  }

  const result = rows
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

  return result.length ? result : fallbackTrend
}


function normalizeProducts(response) {
  const rows = getRows(response)

  if (!rows.length) {
    return fallbackProducts
  }

  const result = rows
    .map((item) => ({
      name:
        item.name ||
        item.product ||
        item.product_name ||
        item.Product ||
        'Product',

      value: getNumber(
        item.value ??
          item.profit ??
          item.revenue ??
          item.sales ??
          item.total
      ),
    }))
    .filter((item) => item.value > 0)
    .slice(0, 5)

  return result.length ? result : fallbackProducts
}


function getKpiValue(data, keys, fallback = 0) {
  if (!data) {
    return fallback
  }

  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) {
      return getNumber(data[key], fallback)
    }
  }

  return fallback
}


function KPICard({
  icon,
  title,
  value,
  change,
  description,
  positive = true,
}) {
  return (
    <div className="metric-kpi-card">
      <div className="metric-kpi-top">
        <div className="metric-kpi-icon">
          {icon}
        </div>

        <div className="metric-kpi-change">
          <TrendingUp size={14} />
          {change}
        </div>
      </div>

      <div className="metric-kpi-title">
        {title}
      </div>

      <div className="metric-kpi-value">
        {value}
      </div>

      <div
        className={
          positive
            ? 'metric-kpi-description positive'
            : 'metric-kpi-description'
        }
      >
        {description}
      </div>
    </div>
  )
}


function Dashboard() {
  const navigate = useNavigate()

  const { dark, toggleDarkMode } = useTheme()

  const [loading, setLoading] = useState(true)
  const [backendOnline, setBackendOnline] = useState(false)
  const [error, setError] = useState('')

  const [kpis, setKpis] = useState({
    revenue: 0,
    profit: 0,
    orders: 0,
    customers: 0,
  })

  const [regionData, setRegionData] =
    useState(fallbackRegion)

  const [categoryData, setCategoryData] =
    useState(fallbackCategory)

  const [trendData, setTrendData] =
    useState(fallbackTrend)

  const [productsData, setProductsData] =
    useState(fallbackProducts)

  const [searchOpen, setSearchOpen] =
    useState(false)

  const [searchText, setSearchText] =
    useState('')


  const categoryColors = [
    '#3155ff',
    '#7c3aed',
    '#06b6d4',
    '#10b981',
    '#f59e0b',
  ]


  const chartTooltipStyle = useMemo(
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
    }),
    [dark]
  )


  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      let online = false

      try {
        await apiService.health()
        online = true
      } catch {
        online = false
      }

      setBackendOnline(online)

      const results =
        await Promise.allSettled([
          apiService.getDashboardKPIs(),
          apiService.getSalesByRegion(),
          apiService.getSalesByCategory(),
          apiService.getSalesTrend('month'),

          typeof apiService.getTopProducts === 'function'
            ? apiService.getTopProducts()
            : Promise.resolve(null),
        ])

      const kpiResult = results[0]
      const regionResult = results[1]
      const categoryResult = results[2]
      const trendResult = results[3]
      const productsResult = results[4]


      if (kpiResult.status === 'fulfilled') {
        const data = getPayload(kpiResult.value)

        setKpis({
          revenue: getKpiValue(
            data,
            [
              'revenue',
              'total_revenue',
              'totalRevenue',
              'sales',
            ],
            0
          ),

          profit: getKpiValue(
            data,
            [
              'profit',
              'total_profit',
              'totalProfit',
            ],
            0
          ),

          orders: getKpiValue(
            data,
            [
              'orders',
              'total_orders',
              'totalOrders',
            ],
            0
          ),

          customers: getKpiValue(
            data,
            [
              'customers',
              'total_customers',
              'totalCustomers',
            ],
            0
          ),
        })
      }


      if (regionResult.status === 'fulfilled') {
        setRegionData(
          normalizeRegionData(
            regionResult.value
          )
        )
      }


      if (categoryResult.status === 'fulfilled') {
        setCategoryData(
          normalizeCategoryData(
            categoryResult.value
          )
        )
      }


      if (trendResult.status === 'fulfilled') {
        setTrendData(
          normalizeTrendData(
            trendResult.value
          )
        )
      }


      if (
        productsResult.status === 'fulfilled' &&
        productsResult.value
      ) {
        setProductsData(
          normalizeProducts(
            productsResult.value
          )
        )
      }


      if (!online) {
        setError(
          'Backend is currently offline. Showing dashboard preview data.'
        )
      }

    } catch (err) {
      console.error(
        'Dashboard loading error:',
        err
      )

      setError(
        'Some dashboard data could not be loaded. Showing available data.'
      )

    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadDashboard()
  }, [])


  return (
    <div
      className={
        dark
          ? 'metric-dashboard metric-dashboard-dark'
          : 'metric-dashboard metric-dashboard-light'
      }
    >

      {/* SIDEBAR */}

      <aside className="metric-sidebar">

        <div className="metric-logo">

          <div className="metric-logo-mark">
            M
          </div>

          <div>
            <div className="metric-logo-name">
              METRICMIND
            </div>

            <div className="metric-logo-subtitle">
              BUSINESS INTELLIGENCE
            </div>
          </div>

        </div>


        <div className="metric-sidebar-section">
          MAIN
        </div>


        <nav className="metric-sidebar-nav">

          <Link
            to="/"
            className="metric-sidebar-link active"
          >
            <Home size={18} />
            <span>Dashboard</span>
          </Link>


          <Link
            to="/dataset"
            className="metric-sidebar-link"
          >
            <Database size={18} />
            <span>Dataset</span>
          </Link>


          <Link
            to="/add-data"
            className="metric-sidebar-link"
          >
            <Plus size={18} />
            <span>Add Data</span>
          </Link>


          <Link
            to="/ai-query"
            className="metric-sidebar-link"
          >
            <Sparkles size={18} />
            <span>AI Query</span>
          </Link>

        </nav>


        <div className="metric-sidebar-section management-title">
          MANAGEMENT
        </div>


        <nav className="metric-sidebar-nav">

          <Link
            to="/settings"
            className="metric-sidebar-link"
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>


          <Link
            to="/reports"
            className="metric-sidebar-link"
          >
            <FileBarChart size={18} />
            <span>Reports</span>
          </Link>

        </nav>


        <div className="metric-sidebar-bottom">

          <div className="metric-sidebar-help">

            <div className="help-icon">
              <Activity size={18} />
            </div>

            <div>
              <strong>Need help?</strong>
              <span>Ask MetricMind AI</span>
            </div>

          </div>


          <div className="metric-sidebar-version">
            MetricMind v1.0
          </div>

        </div>

      </aside>


      {/* MAIN AREA */}

      <div className="metric-main">


        {/* TOP BAR */}

        <header className="metric-topbar">

          <div className="metric-mobile-brand">

            <div className="metric-logo-mark">
              M
            </div>

            <span>
              METRICMIND
            </span>

          </div>


          <div className="metric-search-wrapper">

            {searchOpen ? (

              <div className="metric-search-expanded">

                <Search size={18} />

                <input
                  autoFocus
                  value={searchText}
                  onChange={(event) =>
                    setSearchText(
                      event.target.value
                    )
                  }
                  placeholder="Search dashboard..."
                />

                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false)
                    setSearchText('')
                  }}
                >
                  <X size={17} />
                </button>

              </div>

            ) : (

              <button
                type="button"
                className="metric-search-button"
                onClick={() =>
                  setSearchOpen(true)
                }
              >
                <Search size={18} />

                <span>
                  Search
                </span>

                <kbd>
                  Ctrl K
                </kbd>

              </button>

            )}

          </div>


          <div className="metric-topbar-actions">

            <button
              type="button"
              className="metric-icon-button"
              onClick={toggleDarkMode}
              title="Toggle theme"
            >
              {dark ? (
                <Sun size={19} />
              ) : (
                <Moon size={19} />
              )}
            </button>


            <button
              type="button"
              className="metric-icon-button notification-button"
              title="Notifications"
            >
              <Bell size={19} />

              <span className="notification-dot" />
            </button>


            <div className="metric-profile">

              <div className="metric-avatar">
                B
              </div>

              <div className="metric-profile-text">

                <strong>
                  Bhanu
                </strong>

                <span>
                  Administrator
                </span>

              </div>

              <ChevronRight size={16} />

            </div>

          </div>

        </header>


        {/* CONTENT */}

        <main className="metric-content">


          {/* PAGE HEADING */}

          <section className="metric-page-heading">

            <div>

              <div className="metric-eyebrow">
                BUSINESS OVERVIEW
              </div>

              <h1>
                Good morning <span>👋</span>
              </h1>

              <p>
                Here's your business performance overview.
              </p>

            </div>


            <div className="metric-heading-actions">

              <div
                className={
                  backendOnline
                    ? 'metric-api-status online'
                    : 'metric-api-status offline'
                }
              >
                <span />

                {backendOnline
                  ? 'API Connected'
                  : 'Preview Mode'}
              </div>


              <button
                type="button"
                className="metric-refresh-button"
                onClick={loadDashboard}
                disabled={loading}
              >
                <RefreshCw
                  size={17}
                  className={
                    loading ? 'spin' : ''
                  }
                />

                <span>
                  {loading
                    ? 'Refreshing'
                    : 'Refresh'}
                </span>
              </button>


              {/* NEW ADD DATA BUTTON */}

              <button
                type="button"
                className="metric-add-data-button"
                onClick={() =>
                  navigate('/add-data')
                }
              >
                <Plus size={17} />
                Add Data
              </button>


              <Link
                to="/dataset"
                className="metric-upload-button"
              >
                <Upload size={17} />
                Upload Data
              </Link>

            </div>

          </section>


          {/* ERROR */}

          {error && (
            <div className="metric-notice">
              <Activity size={17} />

              <span>
                {error}
              </span>
            </div>
          )}


          {/* KPI CARDS */}

          <section className="metric-kpi-grid">

            <KPICard
              icon={
                <TrendingUp size={20} />
              }
              title="REVENUE"
              value={formatCurrency(
                kpis.revenue
              )}
              change="+12.5%"
              description="Compared with last period"
            />


            <KPICard
              icon={
                <BarChart3 size={20} />
              }
              title="PROFIT"
              value={formatCurrency(
                kpis.profit
              )}
              change="+8.2%"
              description="Compared with last period"
            />


            <KPICard
              icon={
                <ShoppingCart size={20} />
              }
              title="ORDERS"
              value={formatNumber(
                kpis.orders
              )}
              change="+5.4%"
              description="Compared with last period"
            />


            <KPICard
              icon={
                <Users size={20} />
              }
              title="CUSTOMERS"
              value={formatNumber(
                kpis.customers
              )}
              change="+6.8%"
              description="Compared with last period"
            />

          </section>


          {/* REVENUE TREND + REGION */}

          <section className="metric-chart-grid large-left">

            <div className="metric-chart-card">

              <div className="metric-chart-header">

                <div>

                  <div className="metric-chart-title">
                    REVENUE TREND
                  </div>

                  <div className="metric-chart-subtitle">
                    Monthly revenue performance
                  </div>

                </div>

                <div className="metric-chart-badge">
                  <TrendingUp size={14} />
                  Revenue
                </div>

              </div>


              <div className="metric-chart-area">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart
                    data={trendData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 0,
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
                          ? '#8d99ae'
                          : '#667085',
                        fontSize: 12,
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: dark
                          ? '#8d99ae'
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
                        chartTooltipStyle
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
                        fill: '#3155ff',
                      }}
                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>

            </div>


            <div className="metric-chart-card">

              <div className="metric-chart-header">

                <div>

                  <div className="metric-chart-title">
                    REVENUE BY REGION
                  </div>

                  <div className="metric-chart-subtitle">
                    Sales distribution
                  </div>

                </div>

                <div className="metric-chart-mini-icon">
                  <BarChart3 size={18} />
                </div>

              </div>


              <div className="metric-chart-area">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={regionData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 10,
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
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={65}
                      tick={{
                        fill: dark
                          ? '#d0d5dd'
                          : '#667085',
                        fontSize: 12,
                      }}
                    />

                    <Tooltip
                      contentStyle={
                        chartTooltipStyle
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
                        7,
                        7,
                        0,
                      ]}
                      barSize={22}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>

          </section>


          {/* CATEGORY + PRODUCTS */}

          <section className="metric-chart-grid large-left">

            <div className="metric-chart-card">

              <div className="metric-chart-header">

                <div>

                  <div className="metric-chart-title">
                    REVENUE BY CATEGORY
                  </div>

                  <div className="metric-chart-subtitle">
                    Category contribution
                  </div>

                </div>

                <div className="metric-chart-mini-icon">
                  <PieChart size={18} />
                </div>

              </div>


              <div className="metric-category-layout">

                <div className="metric-pie">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <RechartsPieChart>

                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={88}
                        paddingAngle={3}
                      >

                        {categoryData.map(
                          (_, index) => (
                            <Cell
                              key={index}
                              fill={
                                categoryColors[
                                  index %
                                    categoryColors.length
                                ]
                              }
                            />
                          )
                        )}

                      </Pie>

                      <Tooltip
                        contentStyle={
                          chartTooltipStyle
                        }
                      />

                    </RechartsPieChart>

                  </ResponsiveContainer>

                </div>


                <div className="metric-category-list">

                  {categoryData.map(
                    (item, index) => (

                      <div
                        className="metric-category-item"
                        key={
                          item.name +
                          index
                        }
                      >

                        <div className="metric-category-name">

                          <span
                            className="category-dot"
                            style={{
                              background:
                                categoryColors[
                                  index %
                                    categoryColors.length
                                ],
                            }}
                          />

                          {item.name}

                        </div>

                        <strong>
                          {formatNumber(
                            item.value
                          )}
                        </strong>

                      </div>

                    )
                  )}

                </div>

              </div>

            </div>


            <div className="metric-chart-card">

              <div className="metric-chart-header">

                <div>

                  <div className="metric-chart-title">
                    TOP PRODUCTS
                  </div>

                  <div className="metric-chart-subtitle">
                    Best performing products
                  </div>

                </div>

                <div className="metric-chart-mini-icon">
                  <ShoppingCart size={18} />
                </div>

              </div>


              <div className="metric-products-list">

                {productsData.map(
                  (product, index) => (

                    <div
                      className="metric-product-row"
                      key={
                        product.name +
                        index
                      }
                    >

                      <div className="metric-product-rank">
                        {String(
                          index + 1
                        ).padStart(2, '0')}
                      </div>

                      <div className="metric-product-info">

                        <strong>
                          {product.name}
                        </strong>

                        <span>
                          Top performing product
                        </span>

                      </div>

                      <div className="metric-product-value">
                        {formatCurrency(
                          product.value
                        )}
                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          </section>


          {/* AI COPILOT */}

          <section className="metric-ai-card">

            <div className="metric-ai-glow" />

            <div className="metric-ai-header">

              <div className="metric-ai-icon">
                <Sparkles size={22} />
              </div>

              <div>

                <div className="metric-ai-title">
                  ASK METRICMIND
                </div>

                <div className="metric-ai-subtitle">
                  Ask questions about your business data
                </div>

              </div>

            </div>


            <div className="metric-ai-input-wrapper">

              <input
                type="text"
                placeholder="What is our total revenue?"
              />

              <Link
                to="/ai-query"
                className="metric-ai-submit"
              >
                <ChevronRight size={21} />
              </Link>

            </div>


            <div className="metric-ai-suggestions">

              <Link to="/ai-query">
                What are our top products?
              </Link>

              <Link to="/ai-query">
                Which region has the highest sales?
              </Link>

              <Link to="/ai-query">
                Show monthly revenue
              </Link>

            </div>

          </section>


          {/* QUICK ACTIONS */}

          <section className="metric-quick-actions">


            {/* ADD DATA */}

            <button
              type="button"
              className="metric-quick-action"
              onClick={() =>
                navigate('/add-data')
              }
            >

              <div className="quick-action-icon blue">
                <Plus size={19} />
              </div>

              <div>

                <strong>
                  Add Business Data
                </strong>

                <span>
                  Enter a new sales record
                </span>

              </div>

              <ChevronRight size={17} />

            </button>


            {/* UPLOAD DATA */}

            <Link
              to="/dataset"
              className="metric-quick-action"
            >

              <div className="quick-action-icon blue">
                <Upload size={19} />
              </div>

              <div>

                <strong>
                  Upload Dataset
                </strong>

                <span>
                  Add new business data
                </span>

              </div>

              <ChevronRight size={17} />

            </Link>


            {/* AI ANALYSIS */}

            <Link
              to="/ai-query"
              className="metric-quick-action"
            >

              <div className="quick-action-icon purple">
                <Sparkles size={19} />
              </div>

              <div>

                <strong>
                  AI Analysis
                </strong>

                <span>
                  Ask questions about data
                </span>

              </div>

              <ChevronRight size={17} />

            </Link>


            {/* REPORT */}

            <Link
              to="/reports"
              className="metric-quick-action"
            >

              <div className="quick-action-icon green">
                <FileBarChart size={19} />
              </div>

              <div>

                <strong>
                  Generate Report
                </strong>

                <span>
                  Create business report
                </span>

              </div>

              <ChevronRight size={17} />

            </Link>

          </section>


          {/* FOOTER */}

          <footer className="metric-dashboard-footer">

            <span>
              © 2026 MetricMind
            </span>

            <span>
              AI-Powered Business Intelligence
            </span>

            <span className="footer-status">

              <span />

              System operational

            </span>

          </footer>

        </main>

      </div>

    </div>
  )
}


export default Dashboard