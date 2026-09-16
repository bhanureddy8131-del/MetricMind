import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const PIE_COLORS = [
  '#2563eb',
  '#06b6d4',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#10b981',
  '#ec4899',
  '#f97316',
]

export default function ChartCard({
  title,
  data = [],
  type = 'bar',
  xKey,
  yKey,
  color = '#2563eb',
}) {
  // Make sure data is always an array
  const chartData = Array.isArray(data) ? data : []

  // Find available columns
  const keys = chartData[0]
    ? Object.keys(chartData[0])
    : []

  // Automatically find X-axis column
  const x =
    xKey ||
    keys.find(
      (key) =>
        typeof chartData[0]?.[key] !== 'number' &&
        !isFinite(Number(chartData[0]?.[key]))
    ) ||
    keys[0]

  // Automatically find Y-axis column
  const y =
    yKey ||
    keys.find(
      (key) =>
        typeof chartData[0]?.[key] === 'number' ||
        !isNaN(Number(chartData[0]?.[key]))
    ) ||
    keys[1]

  // Convert numeric strings from API into numbers
  const normalizedData = chartData.map((item) => ({
    ...item,
    ...(y
      ? {
          [y]: isNaN(Number(item[y]))
            ? 0
            : Number(item[y]),
        }
      : {}),
  }))

  const hasData =
    normalizedData.length > 0 &&
    x &&
    y

  return (
    <section className="panel chart-panel">
      {/* Header */}
      <div className="panel-heading">
        <div>
          <h3>{title}</h3>

          <span>
            {hasData
              ? `${normalizedData.length} data points`
              : 'Awaiting data'}
          </span>
        </div>
      </div>

      {/* Chart */}
      {hasData ? (
        <div
          className="chart"
          style={{
            width: '100%',
            height: 320,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            {/* LINE CHART */}
            {type === 'line' && (
              <LineChart
                data={normalizedData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey={x}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  formatter={(value) =>
                    Number(value).toLocaleString()
                  }
                />

                <Line
                  type="monotone"
                  dataKey={y}
                  stroke={color}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            )}

            {/* PIE CHART */}
            {type === 'pie' && (
              <PieChart>
                <Pie
                  data={normalizedData}
                  dataKey={y}
                  nameKey={x}
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  cx="50%"
                  cy="50%"
                >
                  {normalizedData.map(
                    (_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          PIE_COLORS[
                            index %
                              PIE_COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip
                  formatter={(value) =>
                    Number(value).toLocaleString()
                  }
                />
              </PieChart>
            )}

            {/* BAR CHART */}
            {type !== 'line' &&
              type !== 'pie' && (
                <BarChart
                  data={normalizedData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey={x}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    formatter={(value) =>
                      Number(value).toLocaleString()
                    }
                  />

                  <Bar
                    dataKey={y}
                    fill={color}
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-state">
          Run an AI query to populate this
          chart.
        </div>
      )}
    </section>
  )
}