import { useState } from 'react'
import {
  Send,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Loader2,
  Database,
} from 'lucide-react'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

import apiService from '../services/api'
import './AIQuery.css'


function getChartType(question, data) {
  const text = question.toLowerCase()

  if (
    text.includes('monthly') ||
    text.includes('month') ||
    text.includes('weekly') ||
    text.includes('week') ||
    text.includes('daily') ||
    text.includes('day') ||
    text.includes('yearly') ||
    text.includes('trend') ||
    text.includes('over time')
  ) {
    return 'line'
  }

  if (
    text.includes('distribution') ||
    text.includes('share') ||
    text.includes('percentage') ||
    text.includes('proportion')
  ) {
    return 'pie'
  }

  if (
    text.includes('region') ||
    text.includes('category') ||
    text.includes('state') ||
    text.includes('city') ||
    text.includes('product') ||
    text.includes('top') ||
    text.includes('highest') ||
    text.includes('lowest') ||
    text.includes('compare') ||
    text.includes('comparison')
  ) {
    return 'bar'
  }

  if (data && data.length > 1) {
    return 'bar'
  }

  return null
}


function getKeys(data) {
  if (!data || data.length === 0) {
    return {
      labelKey: null,
      valueKey: null,
    }
  }

  const firstRow = data[0]
  const keys = Object.keys(firstRow)

  let labelKey = null
  let valueKey = null

  for (const key of keys) {
    const value = firstRow[key]

    if (
      labelKey === null &&
      typeof value === 'string' &&
      value.trim() !== ''
    ) {
      labelKey = key
    }

    if (
      valueKey === null &&
      (
        typeof value === 'number' ||
        (
          typeof value === 'string' &&
          value.trim() !== '' &&
          !Number.isNaN(Number(value))
        )
      )
    ) {
      valueKey = key
    }
  }

  if (!labelKey) {
    labelKey = keys[0]
  }

  if (!valueKey && keys.length > 1) {
    valueKey = keys[1]
  }

  return {
    labelKey,
    valueKey,
  }
}


function formatValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  const numericValue = Number(value)

  if (!Number.isNaN(numericValue)) {
    return numericValue.toLocaleString('en-IN')
  }

  return String(value)
}


function AutomaticChart({ data, question }) {
  if (!data || data.length === 0) {
    return null
  }

  const chartType = getChartType(question, data)

  const {
    labelKey,
    valueKey,
  } = getKeys(data)

  if (!labelKey || !valueKey) {
    return null
  }

  const chartData = data
    .map((item) => ({
      label: String(item[labelKey] ?? ''),
      value: Number(item[valueKey]) || 0,
    }))
    .filter((item) => item.label !== '')

  if (chartData.length === 0) {
    return null
  }

  const colors = [
    '#3155ff',
    '#5b73ff',
    '#7c8fff',
    '#9eacff',
    '#c0c9ff',
    '#e2e6ff',
  ]

  if (chartType === 'pie') {
    return (
      <section className="chart-panel">

        <div className="chart-panel-header">
          <div className="chart-title-row">
            <PieChartIcon size={20} />
            <div>
              <h3>Automatic Pie Chart</h3>
              <span>
                Chart selected from your question
              </span>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>

              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={'pie-cell-' + index}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
              <Legend />

            </PieChart>
          </ResponsiveContainer>
        </div>

      </section>
    )
  }


  if (chartType === 'line') {
    return (
      <section className="chart-panel">

        <div className="chart-panel-header">
          <div className="chart-title-row">
            <LineChartIcon size={20} />
            <div>
              <h3>Automatic Line Chart</h3>
              <span>
                Trend detected from your question
              </span>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="label"
              />

              <YAxis />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="value"
                name="Value"
                stroke="#3155ff"
                strokeWidth={3}
                dot={{ r: 4 }}
              />

            </LineChart>
          </ResponsiveContainer>
        </div>

      </section>
    )
  }


  if (chartType === 'bar') {
    return (
      <section className="chart-panel">

        <div className="chart-panel-header">
          <div className="chart-title-row">
            <BarChart3 size={20} />
            <div>
              <h3>Automatic Bar Chart</h3>
              <span>
                Comparison detected from your question
              </span>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="label"
                angle={-20}
                textAnchor="end"
                height={70}
              />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="value"
                name="Value"
                fill="#3155ff"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>
          </ResponsiveContainer>
        </div>

      </section>
    )
  }

  return null
}


export default function AIQuery() {

  const [question, setQuestion] = useState('')

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  const [result, setResult] = useState(null)


  const examples = [
    'Show revenue by region',
    'Show sales distribution by category',
    'Show monthly revenue trend',
    'Show top 10 products by revenue',
  ]


  const runQuery = async (queryText = question) => {

    const query = queryText.trim()

    if (!query) {
      return
    }

    setLoading(true)
    setError('')

    try {

      const response = await apiService.query({
        question: query,
      })

      const responseData = response?.data || response

      setResult({
        ...responseData,
        question: query,
      })

    } catch (err) {

      console.error('AI Query error:', err)

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to process your question.'
      )

      setResult(null)

    } finally {

      setLoading(false)

    }
  }


  const handleSubmit = (event) => {

    event.preventDefault()

    runQuery()

  }


  const rows =
    result?.data ||
    result?.rows ||
    result?.results ||
    []


  return (
    <div className="query-page">

      <div className="page-heading">

        <div>

          <div className="eyebrow">
            <Sparkles size={15} />
            MetricMind AI
          </div>

          <h1>Ask MetricMind</h1>

          <p>
            Ask questions about your business data using natural language.
          </p>

        </div>

      </div>


      <section className="query-hero">

        <div className="query-icon">
          <Sparkles size={28} />
        </div>

        <div className="query-input-wrap">

          <form onSubmit={handleSubmit}>

            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: Show revenue by region"
              disabled={loading}
            />

            <button
              type="submit"
              className="query-submit"
              disabled={loading || !question.trim()}
            >

              {loading ? (
                <Loader2
                  size={19}
                  className="spin"
                />
              ) : (
                <Send size={19} />
              )}

              {loading ? 'Analyzing...' : 'Ask'}

            </button>

          </form>

        </div>

      </section>


      <section className="examples">

        <div className="examples-heading">
          Try an example
        </div>

        <div className="example-buttons">

          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuestion(example)
                runQuery(example)
              }}
            >
              {example}
            </button>
          ))}

        </div>

      </section>


      {error && (
        <div className="query-error">
          {error}
        </div>
      )}


      {result && (

        <div className="results-area">

          <section className="conversation">

            <div className="message user">

              <div className="message-avatar">
                You
              </div>

              <div>
                <strong>{result.question}</strong>
              </div>

            </div>


            <div className="message assistant">

              <div className="message-avatar">
                <Sparkles size={17} />
              </div>

              <div>

                <strong>MetricMind</strong>

                <p>
                  {result.answer ||
                    result.message ||
                    'Here is the result of your query.'}
                </p>

              </div>

            </div>

          </section>


          {rows.length > 0 && (
            <AutomaticChart
              data={rows}
              question={result.question}
            />
          )}


          <section className="panel">

            <div className="panel-heading">

              <div>
                <Database size={18} />
                Query Result
              </div>

              <span>
                {rows.length} rows
              </span>

            </div>


            {rows.length > 0 ? (

              <div className="result-table-wrapper">

                <table className="result-table">

                  <thead>

                    <tr>

                      {Object.keys(rows[0]).map((key) => (
                        <th key={key}>
                          {key}
                        </th>
                      ))}

                    </tr>

                  </thead>


                  <tbody>

                    {rows.map((row, index) => (

                      <tr key={'result-row-' + index}>

                        {Object.keys(rows[0]).map((key) => (

                          <td key={'result-cell-' + index + '-' + key}>
                            {formatValue(row[key])}
                          </td>

                        ))}

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            ) : (

              <div className="empty-results">
                No rows were returned.
              </div>

            )}

          </section>


          {result.sql && (

            <section className="panel sql-panel">

              <div className="panel-heading">
                SQL Query
              </div>

              <pre>
                {result.sql}
              </pre>

            </section>

          )}

        </div>

      )}

    </div>
  )
}