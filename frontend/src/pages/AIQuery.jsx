import { useState } from 'react'
import {
  Send,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Loader2,
  Database,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
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


// ============================================================
// CHART TYPE DETECTION
// ============================================================

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
    text.includes('year') ||
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
    text.includes('segment') ||
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


// ============================================================
// FIND LABEL + VALUE COLUMNS
// ============================================================

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
  }

  for (const key of keys) {
    const value = firstRow[key]

    if (
      typeof value === 'number' ||
      (
        typeof value === 'string' &&
        value.trim() !== '' &&
        !Number.isNaN(Number(value))
      )
    ) {
      valueKey = key
      break
    }
  }

  if (!labelKey && keys.length > 0) {
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


// ============================================================
// FORMAT VALUES
// ============================================================

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


// ============================================================
// AUTOMATIC CHART
// ============================================================

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


  // ==========================================================
  // PIE
  // ==========================================================

  if (chartType === 'pie') {
    return (
      <section className="chart-panel">

        <div className="chart-panel-header">
          <div className="chart-title-row">
            <PieChartIcon size={20} />

            <div>
              <h3>Revenue Distribution</h3>

              <span>
                Pie chart generated automatically
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
                    key={`pie-cell-${index}`}
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


  // ==========================================================
  // LINE
  // ==========================================================

  if (chartType === 'line') {
    return (
      <section className="chart-panel">

        <div className="chart-panel-header">
          <div className="chart-title-row">
            <LineChartIcon size={20} />

            <div>
              <h3>Trend Analysis</h3>

              <span>
                Line chart generated from your question
              </span>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="label" />

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


  // ==========================================================
  // BAR
  // ==========================================================

  if (chartType === 'bar') {
    return (
      <section className="chart-panel">

        <div className="chart-panel-header">
          <div className="chart-title-row">
            <BarChart3 size={20} />

            <div>
              <h3>Comparison Analysis</h3>

              <span>
                Bar chart generated automatically
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


// ============================================================
// AI QUERY PAGE
// ============================================================

export default function AIQuery() {

  const [question, setQuestion] = useState('')

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  const [messages, setMessages] = useState([])

  const [openSQL, setOpenSQL] = useState({})


  // ==========================================================
  // EXAMPLE QUESTIONS
  // ==========================================================

  const examples = [
    'Show revenue by region',
    'Show sales distribution by category',
    'Show monthly revenue trend',
    'Show top 10 products by revenue',
    'Show profit by segment',
  ]


  // ==========================================================
  // RUN QUERY
  // ==========================================================

  const runQuery = async (queryText) => {

    const query = String(queryText || '').trim()

    if (!query || loading) {
      return
    }

    setQuestion('')
    setError('')
    setLoading(true)

    const userMessage = {
      id: Date.now(),
      type: 'user',
      question: query,
    }

    setMessages((previous) => [
      ...previous,
      userMessage,
    ])


    try {

      const response = await apiService.query({
        question: query,
      })

      const responseData = response?.data || response

      const rows =
        responseData?.data ||
        responseData?.rows ||
        responseData?.results ||
        []


      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        question: query,
        answer:
          responseData?.answer ||
          responseData?.message ||
          'Here is the result of your query.',
        data: rows,
        sql: responseData?.sql || '',
        metrics_used: responseData?.metrics_used || [],
        dimensions_used:
          responseData?.dimensions_used || [],
        row_count:
          responseData?.row_count ??
          rows.length,
        execution_time_ms:
          responseData?.execution_time_ms,
      }


      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ])

    } catch (err) {

      console.error('AI Query error:', err)

      const message =
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to process your question.'

      setError(message)

    } finally {

      setLoading(false)

    }
  }


  // ==========================================================
  // FORM SUBMIT
  // ==========================================================

  const handleSubmit = (event) => {

    event.preventDefault()

    runQuery(question)

  }


  // ==========================================================
  // CLEAR CHAT
  // ==========================================================

  const clearChat = () => {

    setMessages([])

    setError('')

    setQuestion('')

    setOpenSQL({})

  }


  // ==========================================================
  // SQL TOGGLE
  // ==========================================================

  const toggleSQL = (id) => {

    setOpenSQL((previous) => ({
      ...previous,
      [id]: !previous[id],
    }))

  }


  return (
    <div className="query-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-heading">

        <div>

          <div className="eyebrow">
            <Sparkles size={15} />
            MetricMind AI
          </div>

          <h1>AI Analytics Copilot</h1>

          <p>
            Ask questions about your business data
            using natural language.
          </p>

        </div>


        {messages.length > 0 && (
          <button
            type="button"
            className="clear-chat-button"
            onClick={clearChat}
          >
            <Trash2 size={17} />
            Clear Chat
          </button>
        )}

      </div>


      {/* =====================================================
          WELCOME SCREEN
      ====================================================== */}

      {messages.length === 0 && !loading && (

        <section className="ai-welcome">

          <div className="welcome-icon">
            <Sparkles size={34} />
          </div>

          <h2>How can I help you?</h2>

          <p>
            Ask MetricMind anything about your
            sales, revenue, profit, customers,
            products, or business performance.
          </p>


          <div className="suggested-questions">

            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => runQuery(example)}
              >
                <Sparkles size={15} />
                {example}
              </button>
            ))}

          </div>

        </section>

      )}


      {/* =====================================================
          CHAT AREA
      ====================================================== */}

      {messages.length > 0 && (

        <section className="chat-container">

          {messages.map((message) => (

            <div
              key={message.id}
              className={`chat-message ${message.type}`}
            >

              {/* USER MESSAGE */}

              {message.type === 'user' && (

                <div className="chat-row">

                  <div className="chat-avatar user-avatar">
                    <User size={18} />
                  </div>

                  <div className="chat-bubble user-bubble">

                    <div className="chat-name">
                      You
                    </div>

                    <div className="chat-question">
                      {message.question}
                    </div>

                  </div>

                </div>

              )}


              {/* AI MESSAGE */}

              {message.type === 'assistant' && (

                <div className="chat-row">

                  <div className="chat-avatar ai-avatar">
                    <Sparkles size={18} />
                  </div>

                  <div className="chat-bubble ai-bubble">

                    <div className="chat-name">
                      MetricMind
                    </div>


                    <p className="ai-answer">
                      {message.answer}
                    </p>


                    {/* QUERY INFO */}

                    <div className="query-info">

                      <span>
                        {message.row_count || 0} rows
                      </span>

                      {message.execution_time_ms !==
                        undefined &&
                        message.execution_time_ms !==
                        null && (
                          <span>
                            {message.execution_time_ms} ms
                          </span>
                        )}

                    </div>


                    {/* CHART */}

                    {message.data &&
                      message.data.length > 0 && (

                        <AutomaticChart
                          data={message.data}
                          question={message.question}
                        />

                      )}


                    {/* RESULT TABLE */}

                    {message.data &&
                      message.data.length > 0 && (

                        <section className="panel">

                          <div className="panel-heading">

                            <div>
                              <Database size={18} />
                              Query Result
                            </div>

                            <span>
                              {message.data.length} rows
                            </span>

                          </div>


                          <div className="result-table-wrapper">

                            <table className="result-table">

                              <thead>

                                <tr>

                                  {Object.keys(
                                    message.data[0]
                                  ).map((key) => (
                                    <th key={key}>
                                      {key}
                                    </th>
                                  ))}

                                </tr>

                              </thead>


                              <tbody>

                                {message.data.map(
                                  (row, index) => (

                                    <tr
                                      key={`result-row-${message.id}-${index}`}
                                    >

                                      {Object.keys(
                                        message.data[0]
                                      ).map((key) => (

                                        <td
                                          key={`result-cell-${message.id}-${index}-${key}`}
                                        >
                                          {formatValue(
                                            row[key]
                                          )}
                                        </td>

                                      ))}

                                    </tr>

                                  )
                                )}

                              </tbody>

                            </table>

                          </div>

                        </section>

                      )}


                    {/* SQL */}

                    {message.sql && (

                      <section className="sql-section">

                        <button
                          type="button"
                          className="sql-toggle"
                          onClick={() =>
                            toggleSQL(message.id)
                          }
                        >

                          <span>
                            SQL Query
                          </span>

                          {openSQL[message.id] ? (
                            <ChevronUp size={17} />
                          ) : (
                            <ChevronDown size={17} />
                          )}

                        </button>


                        {openSQL[message.id] && (

                          <pre className="sql-code">
                            {message.sql}
                          </pre>

                        )}

                      </section>

                    )}

                  </div>

                </div>

              )}

            </div>

          ))}


          {/* =================================================
              LOADING
          ================================================== */}

          {loading && (

            <div className="chat-message assistant">

              <div className="chat-row">

                <div className="chat-avatar ai-avatar">
                  <Sparkles size={18} />
                </div>

                <div className="chat-bubble ai-bubble">

                  <div className="chat-name">
                    MetricMind
                  </div>

                  <div className="thinking">

                    <Loader2
                      size={18}
                      className="spin"
                    />

                    <span>
                      Analyzing your business data...
                    </span>

                  </div>

                </div>

              </div>

            </div>

          )}

        </section>

      )}


      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="query-error">

          <strong>Unable to answer</strong>

          <span>
            {error}
          </span>

        </div>

      )}


      {/* =====================================================
          INPUT
      ====================================================== */}

      <section className="chat-input-area">

        <form
          className="chat-input-form"
          onSubmit={handleSubmit}
        >

          <div className="input-icon">
            <Sparkles size={20} />
          </div>


          <input
            type="text"
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            placeholder="Ask MetricMind anything about your data..."
            disabled={loading}
          />


          <button
            type="submit"
            disabled={
              loading ||
              !question.trim()
            }
          >

            {loading ? (
              <Loader2
                size={20}
                className="spin"
              />
            ) : (
              <Send size={20} />
            )}

          </button>

        </form>


        <div className="input-hint">
          Press Enter to ask • MetricMind analyzes
          your business data automatically
        </div>

      </section>

    </div>
  )
}