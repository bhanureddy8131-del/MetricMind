import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  DollarSign,
  ShoppingCart,
  Activity,
  Brain,
  BarChart3,
  RefreshCw,
  ChevronRight,
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

import './BusinessIntelligence.css'

/* =========================================================
   DEMO DATA
   ========================================================= */

const monthlyData = [
  { month: 'Jan', revenue: 180000, sales: 120 },
  { month: 'Feb', revenue: 205000, sales: 138 },
  { month: 'Mar', revenue: 198000, sales: 132 },
  { month: 'Apr', revenue: 230000, sales: 151 },
  { month: 'May', revenue: 245000, sales: 164 },
  { month: 'Jun', revenue: 260000, sales: 172 },
]

const forecastData = [
  { month: 'Jan', actual: 180000 },
  { month: 'Feb', actual: 205000 },
  { month: 'Mar', actual: 198000 },
  { month: 'Apr', actual: 230000 },
  { month: 'May', actual: 245000 },
  { month: 'Jun', actual: 260000 },
  { month: 'Jul', forecast: 275000 },
  { month: 'Aug', forecast: 289000 },
  { month: 'Sep', forecast: 304000 },
  { month: 'Oct', forecast: 318000 },
  { month: 'Nov', forecast: 333000 },
  { month: 'Dec', forecast: 350000 },
]

/* =========================================================
   HELPERS
   ========================================================= */

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(
    Number(value) || 0
  )
}

function calculateProgress(current, target) {
  if (!target) return 0

  return Math.min(
    100,
    Math.round((current / target) * 100)
  )
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function BusinessIntelligence() {
  const navigate = useNavigate()

  const [activeSection, setActiveSection] =
    useState('insights')

  const [lastUpdated, setLastUpdated] =
    useState(new Date())

  const [goals, setGoals] = useState({
    revenue: 3000000,
    profit: 400000,
  })

  const currentRevenue = 1318000
  const currentProfit = 286397
  const currentSales = 877

  const revenueProgress =
    calculateProgress(
      currentRevenue,
      goals.revenue
    )

  const profitProgress =
    calculateProgress(
      currentProfit,
      goals.profit
    )

  const averageMonthlyRevenue =
    monthlyData.reduce(
      (sum, item) => sum + item.revenue,
      0
    ) / monthlyData.length

  const forecastRevenue =
    forecastData
      .filter((item) => item.forecast)
      .reduce(
        (sum, item) => sum + item.forecast,
        0
      )

  const forecastAccuracy = 91

  const refreshData = () => {
    setLastUpdated(new Date())
  }

  const sections = [
    {
      id: 'insights',
      label: 'AI Insights',
      icon: Sparkles,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: Bell,
    },
    {
      id: 'forecast',
      label: 'Forecasting',
      icon: TrendingUp,
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: Target,
    },
  ]

  return (
    <div className="bi-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="bi-header">

        <div className="bi-header-left">

          <button
            className="bi-back-button"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

          <div>

            <div className="bi-eyebrow">
              <Brain size={16} />
              MetricMind Intelligence
            </div>

            <h1>
              Business Intelligence Center
            </h1>

            <p>
              Insights, alerts, forecasts and
              business goals in one place.
            </p>

          </div>

        </div>

        <button
          className="bi-refresh-button"
          onClick={refreshData}
        >
          <RefreshCw size={17} />
          Refresh
        </button>

      </header>


      {/* =================================================
          LAST UPDATED
      ================================================= */}

      <div className="bi-updated">

        <Activity size={15} />

        Last updated:
        {' '}
        {lastUpdated.toLocaleTimeString(
          'en-IN',
          {
            hour: '2-digit',
            minute: '2-digit',
          }
        )}

      </div>


      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="bi-tabs">

        {sections.map((section) => {

          const Icon = section.icon

          return (
            <button
              key={section.id}
              className={
                activeSection === section.id
                  ? 'bi-tab active'
                  : 'bi-tab'
              }
              onClick={() =>
                setActiveSection(
                  section.id
                )
              }
            >
              <Icon size={18} />
              {section.label}
            </button>
          )

        })}

      </nav>


      {/* =================================================
          INSIGHTS
      ================================================= */}

      {activeSection === 'insights' && (

        <section className="bi-section">

          <div className="bi-section-heading">

            <div>
              <span className="bi-label">
                AI INSIGHTS
              </span>

              <h2>
                What is happening in your business?
              </h2>

              <p>
                MetricMind automatically identifies
                important business patterns.
              </p>
            </div>

          </div>


          <div className="bi-kpi-grid">

            <InsightKPI
              icon={DollarSign}
              title="Revenue"
              value={formatCurrency(
                currentRevenue
              )}
              change="+12.4%"
              positive
            />

            <InsightKPI
              icon={TrendingUp}
              title="Profit"
              value={formatCurrency(
                currentProfit
              )}
              change="+8.7%"
              positive
            />

            <InsightKPI
              icon={ShoppingCart}
              title="Sales"
              value={formatNumber(
                currentSales
              )}
              change="+6.2%"
              positive
            />

            <InsightKPI
              icon={Target}
              title="Goal Progress"
              value={`${revenueProgress}%`}
              change="Revenue goal"
              positive
            />

          </div>


          <div className="bi-two-column">

            <div className="bi-card">

              <div className="bi-card-heading">

                <div className="bi-card-icon purple">
                  <Sparkles size={20} />
                </div>

                <div>
                  <h3>
                    AI Business Insights
                  </h3>

                  <p>
                    Automatically detected patterns
                  </p>
                </div>

              </div>


              <div className="insight-list">

                <InsightItem
                  type="positive"
                  title="Revenue is growing"
                  text="Revenue has increased consistently across recent months."
                />

                <InsightItem
                  type="positive"
                  title="Sales momentum is strong"
                  text="Sales volume is showing an upward trend."
                />

                <InsightItem
                  type="warning"
                  title="Profit requires attention"
                  text="Profit growth is slower than revenue growth."
                />

                <InsightItem
                  type="info"
                  title="Forecast shows continued growth"
                  text="Projected revenue remains above the current monthly average."
                />

              </div>

            </div>


            <div className="bi-card">

              <div className="bi-card-heading">

                <div className="bi-card-icon blue">
                  <BarChart3 size={20} />
                </div>

                <div>
                  <h3>
                    Revenue Trend
                  </h3>

                  <p>
                    Recent business performance
                  </p>
                </div>

              </div>


              <div className="bi-chart">

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <LineChart
                    data={monthlyData}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="month"
                    />

                    <YAxis />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3155ff"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                      }}
                    />

                  </LineChart>
                </ResponsiveContainer>

              </div>

            </div>

          </div>

        </section>

      )}


      {/* =================================================
          ALERTS
      ================================================= */}

      {activeSection === 'alerts' && (

        <section className="bi-section">

          <div className="bi-section-heading">

            <div>
              <span className="bi-label">
                INSIGHTS & ALERTS
              </span>

              <h2>
                Stay ahead of important changes
              </h2>

              <p>
                Monitor revenue, profit and business
                performance automatically.
              </p>
            </div>

          </div>


          <div className="alert-summary">

            <AlertSummary
              icon={CheckCircle}
              title="Healthy"
              value="4"
              className="healthy"
            />

            <AlertSummary
              icon={AlertTriangle}
              title="Warnings"
              value="2"
              className="warning"
            />

            <AlertSummary
              icon={Bell}
              title="Notifications"
              value="6"
              className="info"
            />

          </div>


          <div className="bi-card">

            <div className="bi-card-heading">

              <div className="bi-card-icon orange">
                <Bell size={20} />
              </div>

              <div>
                <h3>
                  Active Alerts
                </h3>

                <p>
                  Business conditions requiring attention
                </p>
              </div>

            </div>


            <div className="alert-list">

              <AlertItem
                severity="warning"
                title="Profit margin declining"
                description="Profit is growing slower than revenue."
                category="Profit Alert"
              />

              <AlertItem
                severity="warning"
                title="High discount activity"
                description="Discount levels may be affecting profitability."
                category="Performance Alert"
              />

              <AlertItem
                severity="success"
                title="Revenue target progressing"
                description="Revenue is currently tracking toward the configured goal."
                category="Revenue Alert"
              />

              <AlertItem
                severity="info"
                title="Sales volume increased"
                description="Sales volume has increased compared with the previous period."
                category="Performance Alert"
              />

            </div>

          </div>

        </section>

      )}


      {/* =================================================
          FORECAST
      ================================================= */}

      {activeSection === 'forecast' && (

        <section className="bi-section">

          <div className="bi-section-heading">

            <div>

              <span className="bi-label">
                FORECASTING
              </span>

              <h2>
                See where your business is heading
              </h2>

              <p>
                Revenue and sales projections based
                on historical business patterns.
              </p>

            </div>

          </div>


          <div className="bi-kpi-grid">

            <InsightKPI
              icon={TrendingUp}
              title="Forecast Revenue"
              value={formatCurrency(
                forecastRevenue
              )}
              change="Projected"
              positive
            />

            <InsightKPI
              icon={BarChart3}
              title="Average Monthly Revenue"
              value={formatCurrency(
                averageMonthlyRevenue
              )}
              change="Historical average"
              positive
            />

            <InsightKPI
              icon={Target}
              title="Forecast Accuracy"
              value={`${forecastAccuracy}%`}
              change="Model accuracy"
              positive
            />

            <InsightKPI
              icon={Activity}
              title="Forecast Horizon"
              value="6 Months"
              change="Projection period"
              positive
            />

          </div>


          <div className="bi-card">

            <div className="bi-card-heading">

              <div className="bi-card-icon blue">
                <TrendingUp size={20} />
              </div>

              <div>
                <h3>
                  Revenue Forecast
                </h3>

                <p>
                  Historical revenue and projected revenue
                </p>
              </div>

            </div>


            <div className="bi-chart">

              <ResponsiveContainer
                width="100%"
                height={380}
              >

                <LineChart
                  data={forecastData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="month"
                  />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Revenue"
                    stroke="#3155ff"
                    strokeWidth={3}
                    connectNulls
                  />

                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Forecast Revenue"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    strokeDasharray="7 5"
                    connectNulls
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>


          <div className="bi-two-column">

            <div className="bi-card">

              <div className="bi-card-heading">

                <div className="bi-card-icon green">
                  <BarChart3 size={20} />
                </div>

                <div>
                  <h3>
                    Sales Forecast
                  </h3>

                  <p>
                    Expected sales volume
                  </p>
                </div>

              </div>


              <div className="bi-chart">

                <ResponsiveContainer
                  width="100%"
                  height={280}
                >

                  <BarChart
                    data={monthlyData}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="month"
                    />

                    <YAxis />

                    <Tooltip />

                    <Bar
                      dataKey="sales"
                      name="Sales"
                      fill="#3155ff"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>


            <div className="bi-card accuracy-card">

              <div className="accuracy-circle">

                <strong>
                  {forecastAccuracy}%
                </strong>

                <span>
                  Accuracy
                </span>

              </div>

              <h3>
                Forecast Accuracy
              </h3>

              <p>
                The forecasting model is currently
                tracking historical business patterns.
              </p>

              <div className="accuracy-bar">
                <div
                  style={{
                    width: `${forecastAccuracy}%`,
                  }}
                />
              </div>

            </div>

          </div>

        </section>

      )}


      {/* =================================================
          GOALS
      ================================================= */}

      {activeSection === 'goals' && (

        <section className="bi-section">

          <div className="bi-section-heading">

            <div>

              <span className="bi-label">
                BUSINESS GOALS
              </span>

              <h2>
                Track your business targets
              </h2>

              <p>
                Set revenue and profit targets and
                monitor progress automatically.
              </p>

            </div>

          </div>


          <div className="goal-grid">

            <GoalCard
              title="Revenue Goal"
              icon={DollarSign}
              current={currentRevenue}
              target={goals.revenue}
              progress={revenueProgress}
              onTargetChange={(value) =>
                setGoals((previous) => ({
                  ...previous,
                  revenue:
                    Number(value) || 0,
                }))
              }
            />

            <GoalCard
              title="Profit Goal"
              icon={TrendingUp}
              current={currentProfit}
              target={goals.profit}
              progress={profitProgress}
              onTargetChange={(value) =>
                setGoals((previous) => ({
                  ...previous,
                  profit:
                    Number(value) || 0,
                }))
              }
            />

          </div>


          <div className="bi-card goal-progress-card">

            <div className="bi-card-heading">

              <div className="bi-card-icon purple">
                <Target size={20} />
              </div>

              <div>

                <h3>
                  Goal Progress
                </h3>

                <p>
                  Overall progress toward your business targets
                </p>

              </div>

            </div>


            <div className="overall-progress">

              <div className="progress-row">

                <div className="progress-label">

                  <span>
                    Revenue
                  </span>

                  <strong>
                    {revenueProgress}%
                  </strong>

                </div>

                <div className="progress-track">

                  <div
                    className="progress-fill revenue-fill"
                    style={{
                      width:
                        `${revenueProgress}%`,
                    }}
                  />

                </div>

              </div>


              <div className="progress-row">

                <div className="progress-label">

                  <span>
                    Profit
                  </span>

                  <strong>
                    {profitProgress}%
                  </strong>

                </div>

                <div className="progress-track">

                  <div
                    className="progress-fill profit-fill"
                    style={{
                      width:
                        `${profitProgress}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          </div>

        </section>

      )}

    </div>
  )
}


/* =========================================================
   COMPONENTS
   ========================================================= */

function InsightKPI({
  icon: Icon,
  title,
  value,
  change,
  positive,
}) {
  return (
    <div className="bi-kpi-card">

      <div className="bi-kpi-icon">
        <Icon size={21} />
      </div>

      <div className="bi-kpi-content">

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small
          className={
            positive
              ? 'positive'
              : 'negative'
          }
        >
          {positive ? (
            <TrendingUp size={13} />
          ) : (
            <TrendingDown size={13} />
          )}

          {change}
        </small>

      </div>

    </div>
  )
}


function InsightItem({
  type,
  title,
  text,
}) {
  const Icon =
    type === 'positive'
      ? CheckCircle
      : type === 'warning'
        ? AlertTriangle
        : Sparkles

  return (
    <div className={`insight-item ${type}`}>

      <Icon size={19} />

      <div>

        <strong>
          {title}
        </strong>

        <p>
          {text}
        </p>

      </div>

      <ChevronRight size={17} />

    </div>
  )
}


function AlertSummary({
  icon: Icon,
  title,
  value,
  className,
}) {
  return (
    <div className={`alert-summary-card ${className}`}>

      <Icon size={24} />

      <div>

        <strong>
          {value}
        </strong>

        <span>
          {title}
        </span>

      </div>

    </div>
  )
}


function AlertItem({
  severity,
  title,
  description,
  category,
}) {
  const Icon =
    severity === 'warning'
      ? AlertTriangle
      : severity === 'success'
        ? CheckCircle
        : Bell

  return (
    <div className={`alert-item ${severity}`}>

      <div className="alert-item-icon">
        <Icon size={20} />
      </div>

      <div className="alert-item-content">

        <div className="alert-item-title">

          <strong>
            {title}
          </strong>

          <span>
            {category}
          </span>

        </div>

        <p>
          {description}
        </p>

      </div>

      <ChevronRight size={18} />

    </div>
  )
}


function GoalCard({
  title,
  icon: Icon,
  current,
  target,
  progress,
  onTargetChange,
}) {
  return (
    <div className="goal-card">

      <div className="goal-card-header">

        <div className="goal-icon">
          <Icon size={22} />
        </div>

        <div>

          <h3>
            {title}
          </h3>

          <span>
            Goal Progress
          </span>

        </div>

      </div>


      <div className="goal-values">

        <div>
          <span>Current</span>
          <strong>
            {formatCurrency(current)}
          </strong>
        </div>

        <div>
          <span>Target</span>
          <strong>
            {formatCurrency(target)}
          </strong>
        </div>

      </div>


      <div className="goal-progress">

        <div className="goal-progress-header">

          <span>
            Progress
          </span>

          <strong>
            {progress}%
          </strong>

        </div>

        <div className="progress-track">

          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>


      <label className="goal-input-label">
        Update Target
      </label>

      <input
        type="number"
        value={target}
        onChange={(event) =>
          onTargetChange(
            event.target.value
          )
        }
        min="0"
      />

    </div>
  )
}