import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  Download,
  FileText,
  PieChart,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'

import { apiService } from '../services/api'

function Reports() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('Sales Report')
  const [period, setPeriod] = useState('All Time')

  const [kpis, setKpis] = useState({
    revenue: 0,
    profit: 0,
    orders: 0,
    customers: 0,
  })

  const [data, setData] = useState([])

  useEffect(() => {
    loadReport()
  }, [])

  async function loadReport() {
    setLoading(true)

    try {
      const [
        revenueResult,
        profitResult,
        ordersResult,
        customersResult,
        regionResult,
      ] = await Promise.all([
        apiService.query('What is our total revenue?'),
        apiService.query('What is our total profit?'),
        apiService.query('How many orders do we have?'),
        apiService.query('How many customers do we have?'),
        apiService.query(
          'What is total revenue by region?'
        ),
      ])

      setKpis({
        revenue: extractNumber(revenueResult),
        profit: extractNumber(profitResult),
        orders: extractNumber(ordersResult),
        customers: extractNumber(customersResult),
      })

      if (Array.isArray(regionResult?.data)) {
        setData(regionResult.data)
      } else {
        setData([])
      }
    } catch (error) {
      console.error('Report error:', error)
    } finally {
      setLoading(false)
    }
  }

  function extractNumber(result) {
    if (!result) return 0

    if (Array.isArray(result.data)) {
      const first = result.data[0]

      if (typeof first === 'number') {
        return first
      }

      if (first && typeof first === 'object') {
        for (const value of Object.values(first)) {
          if (
            typeof value === 'number' &&
            Number.isFinite(value)
          ) {
            return value
          }

          if (
            typeof value === 'string' &&
            Number.isFinite(Number(value))
          ) {
            return Number(value)
          }
        }
      }
    }

    if (typeof result.data === 'number') {
      return result.data
    }

    if (typeof result.answer === 'string') {
      const match = result.answer.match(
        /-?\d[\d,]*(?:\.\d+)?/
      )

      if (match) {
        return Number(
          match[0].replace(/,/g, '')
        )
      }
    }

    return 0
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0)
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('en-IN').format(
      value || 0
    )
  }

  function downloadReport() {
    const report = {
      report: reportType,
      period,
      generated_at: new Date().toISOString(),
      summary: kpis,
      regional_data: data,
    }

    const blob = new Blob(
      [JSON.stringify(report, null, 2)],
      {
        type: 'application/json',
      }
    )

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'metricmind-report.json'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  return (
    <div className="reports-page">

      <div className="reports-header">

        <button
          className="back-button"
          type="button"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="reports-title">
          <div className="reports-title-icon">
            <FileText size={28} />
          </div>

          <div>
            <h1>Reports</h1>

            <p>
              Generate business reports from your
              MetricMind data.
            </p>
          </div>
        </div>

        <button
          className="refresh-button"
          type="button"
          onClick={loadReport}
          disabled={loading}
        >
          <RefreshCw
            size={18}
            className={
              loading ? 'spin' : ''
            }
          />

          Refresh
        </button>

      </div>

      <div className="report-controls">

        <div className="control-group">
          <label>Report Type</label>

          <select
            value={reportType}
            onChange={(event) =>
              setReportType(event.target.value)
            }
          >
            <option>
              Sales Report
            </option>

            <option>
              Profit Report
            </option>

            <option>
              Customer Report
            </option>

            <option>
              Product Performance
            </option>

            <option>
              Regional Sales
            </option>

            <option>
              Category Performance
            </option>
          </select>
        </div>

        <div className="control-group">
          <label>Period</label>

          <select
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value)
            }
          >
            <option>All Time</option>
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
            <option>Last Year</option>
          </select>
        </div>

        <button
          className="generate-button"
          type="button"
          onClick={loadReport}
        >
          <BarChart3 size={18} />
          Generate Report
        </button>

      </div>

      <div className="report-kpis">

        <div className="report-kpi-card">
          <div className="kpi-icon revenue">
            <TrendingUp size={22} />
          </div>

          <div>
            <span>Total Revenue</span>

            <strong>
              {loading
                ? 'Loading...'
                : formatCurrency(kpis.revenue)}
            </strong>
          </div>
        </div>

        <div className="report-kpi-card">
          <div className="kpi-icon profit">
            <TrendingUp size={22} />
          </div>

          <div>
            <span>Total Profit</span>

            <strong>
              {loading
                ? 'Loading...'
                : formatCurrency(kpis.profit)}
            </strong>
          </div>
        </div>

        <div className="report-kpi-card">
          <div className="kpi-icon orders">
            <BarChart3 size={22} />
          </div>

          <div>
            <span>Total Orders</span>

            <strong>
              {loading
                ? 'Loading...'
                : formatNumber(kpis.orders)}
            </strong>
          </div>
        </div>

        <div className="report-kpi-card">
          <div className="kpi-icon customers">
            <PieChart size={22} />
          </div>

          <div>
            <span>Total Customers</span>

            <strong>
              {loading
                ? 'Loading...'
                : formatNumber(kpis.customers)}
            </strong>
          </div>
        </div>

      </div>

      <div className="report-grid">

        <div className="report-card">

          <div className="report-card-header">
            <div>
              <h2>Regional Performance</h2>

              <p>
                Revenue distribution by region
              </p>
            </div>

            <BarChart3 size={22} />
          </div>

          {data.length === 0 ? (
            <div className="empty-report">
              <BarChart3 size={40} />

              <p>
                No regional data available.
              </p>
            </div>
          ) : (
            <div className="report-table-wrapper">

              <table className="report-table">

                <thead>
                  <tr>
                    <th>Region</th>
                    <th>Revenue</th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((row, index) => {

                    const values =
                      Object.values(row || {})

                    return (
                      <tr key={index}>
                        <td>
                          {String(
                            values[0] ?? '-'
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            Number(values[1]) || 0
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

              </table>

            </div>
          )}

        </div>

        <div className="report-card">

          <div className="report-card-header">
            <div>
              <h2>Report Summary</h2>

              <p>
                {reportType} • {period}
              </p>
            </div>

            <FileText size={22} />
          </div>

          <div className="summary-list">

            <div>
              <span>Revenue</span>
              <strong>
                {formatCurrency(kpis.revenue)}
              </strong>
            </div>

            <div>
              <span>Profit</span>
              <strong>
                {formatCurrency(kpis.profit)}
              </strong>
            </div>

            <div>
              <span>Orders</span>
              <strong>
                {formatNumber(kpis.orders)}
              </strong>
            </div>

            <div>
              <span>Customers</span>
              <strong>
                {formatNumber(kpis.customers)}
              </strong>
            </div>

          </div>

          <button
            className="download-report-button"
            type="button"
            onClick={downloadReport}
          >
            <Download size={18} />
            Download Report
          </button>

        </div>

      </div>

    </div>
  )
}

export default Reports