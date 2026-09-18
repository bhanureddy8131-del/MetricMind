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
  Users,
  ShoppingCart,
} from 'lucide-react'

import { apiService } from '../services/api'


function Reports() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [reportType, setReportType] =
    useState('Sales Report')

  const [period, setPeriod] =
    useState('All Time')

  const [kpis, setKpis] = useState({
    revenue: 0,
    profit: 0,
    orders: 0,
    customers: 0,
  })

  const [regionData, setRegionData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [productData, setProductData] = useState([])


  useEffect(() => {
    loadReport()
  }, [period, reportType])


  async function ask(question) {
    try {
      return await apiService.query(question)
    } catch (error) {
      console.error(
        'Report query failed:',
        question,
        error
      )

      return null
    }
  }


  async function loadReport() {
    setLoading(true)
    setError('')

    try {
      /*
       * These queries use the SAME backend dataset
       * used by the MetricMind Dashboard.
       */

      const [
        revenueResult,
        profitResult,
        ordersResult,
        customersResult,
        regionResult,
        categoryResult,
        productResult,
      ] = await Promise.all([

        ask(
          'What is our total revenue?'
        ),

        ask(
          'What is our total profit?'
        ),

        ask(
          'How many orders do we have?'
        ),

        ask(
          'How many customers do we have?'
        ),

        ask(
          'What is total revenue by region?'
        ),

        ask(
          'What is total revenue by category?'
        ),

        ask(
          'Show top 10 products by profit'
        ),

      ])


      const revenue =
        extractNumber(revenueResult)

      const profit =
        extractNumber(profitResult)

      const orders =
        extractNumber(ordersResult)

      const customers =
        extractNumber(customersResult)


      setKpis({
        revenue,
        profit,
        orders,
        customers,
      })


      setRegionData(
        normalizeRows(regionResult)
      )


      setCategoryData(
        normalizeRows(categoryResult)
      )


      setProductData(
        normalizeRows(productResult)
      )


      const everythingFailed =
        !revenueResult &&
        !profitResult &&
        !ordersResult &&
        !customersResult

      if (everythingFailed) {
        setError(
          'Unable to load dataset information from the backend.'
        )
      }

    } catch (error) {
      console.error(
        'Report loading error:',
        error
      )

      setError(
        error?.message ||
        'Unable to load report data.'
      )
    } finally {
      setLoading(false)
    }
  }


  function extractNumber(result) {
    if (!result) {
      return 0
    }


    if (Array.isArray(result.data)) {

      if (result.data.length === 0) {
        return 0
      }


      const first =
        result.data[0]


      if (
        typeof first === 'number'
      ) {
        return first
      }


      if (
        first &&
        typeof first === 'object'
      ) {

        const values =
          Object.values(first)


        for (const value of values) {

          if (
            typeof value === 'number' &&
            Number.isFinite(value)
          ) {
            return value
          }


          if (
            typeof value === 'string' &&
            value.trim() !== '' &&
            Number.isFinite(
              Number(value)
            )
          ) {
            return Number(value)
          }
        }
      }
    }


    if (
      typeof result.data === 'number'
    ) {
      return result.data
    }


    if (
      result.data &&
      typeof result.data === 'object'
    ) {

      const values =
        Object.values(result.data)


      for (const value of values) {

        if (
          typeof value === 'number' &&
          Number.isFinite(value)
        ) {
          return value
        }

        if (
          typeof value === 'string' &&
          value.trim() !== '' &&
          Number.isFinite(
            Number(value)
          )
        ) {
          return Number(value)
        }
      }
    }


    if (
      typeof result.answer === 'string'
    ) {

      const match =
        result.answer.match(
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


  function normalizeRows(result) {
    if (!result) {
      return []
    }


    if (
      Array.isArray(result.data)
    ) {
      return result.data
    }


    if (
      result.data &&
      Array.isArray(
        result.data.data
      )
    ) {
      return result.data.data
    }


    return []
  }


  function getRowName(row) {
    if (!row) {
      return 'Unknown'
    }


    return (
      row.name ||
      row.region ||
      row.category ||
      row.product_name ||
      row.product ||
      row.Product ||
      row.Region ||
      row.Category ||
      Object.values(row)[0] ||
      'Unknown'
    )
  }


  function getRowValue(row) {
    if (!row) {
      return 0
    }


    const possibleKeys = [
      'value',
      'revenue',
      'sales',
      'profit',
      'total',
      'amount',
      'total_revenue',
    ]


    for (
      const key of possibleKeys
    ) {

      if (
        row[key] !== undefined &&
        row[key] !== null
      ) {

        const value =
          Number(row[key])

        if (
          Number.isFinite(value)
        ) {
          return value
        }
      }
    }


    const values =
      Object.values(row)


    for (
      const value of values
    ) {

      if (
        typeof value === 'number' &&
        Number.isFinite(value)
      ) {
        return value
      }


      if (
        typeof value === 'string' &&
        value.trim() !== '' &&
        Number.isFinite(
          Number(value)
        )
      ) {
        return Number(value)
      }
    }


    return 0
  }


  function formatCurrency(value) {
    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value) || 0
    )
  }


  function formatNumber(value) {
    return new Intl.NumberFormat(
      'en-IN'
    ).format(
      Number(value) || 0
    )
  }


  function downloadReport() {

    const report = {
      report: reportType,
      period,
      generated_at:
        new Date().toISOString(),

      source:
        'MetricMind Dataset',

      summary: {
        total_revenue:
          kpis.revenue,

        total_profit:
          kpis.profit,

        total_orders:
          kpis.orders,

        total_customers:
          kpis.customers,
      },

      regional_data:
        regionData,

      category_data:
        categoryData,

      product_data:
        productData,
    }


    const blob = new Blob(
      [
        JSON.stringify(
          report,
          null,
          2
        ),
      ],
      {
        type:
          'application/json',
      }
    )


    const url =
      URL.createObjectURL(blob)


    const link =
      document.createElement('a')


    link.href = url

    link.download =
      'metricmind-report.json'


    document.body.appendChild(
      link
    )

    link.click()

    document.body.removeChild(
      link
    )


    URL.revokeObjectURL(
      url
    )
  }


  return (
    <div className="reports-page">

      {/* HEADER */}

      <div className="reports-header">

        <button
          className="back-button"
          type="button"
          onClick={() =>
            navigate('/')
          }
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>


        <div className="reports-title">

          <div className="reports-title-icon">
            <FileText size={28} />
          </div>


          <div>

            <h1>
              Reports
            </h1>

            <p>
              Reports generated directly
              from your MetricMind dataset.
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
              loading
                ? 'spin'
                : ''
            }
          />

          {loading
            ? 'Refreshing...'
            : 'Refresh'}

        </button>

      </div>


      {/* ERROR */}

      {error && (

        <div className="report-error">

          {error}

        </div>

      )}


      {/* CONTROLS */}

      <div className="report-controls">

        <div className="control-group">

          <label>
            Report Type
          </label>

          <select
            value={reportType}
            onChange={(event) =>
              setReportType(
                event.target.value
              )
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

          <label>
            Period
          </label>

          <select
            value={period}
            onChange={(event) =>
              setPeriod(
                event.target.value
              )
            }
          >

            <option>
              All Time
            </option>

            <option>
              This Month
            </option>

            <option>
              Last Month
            </option>

            <option>
              This Year
            </option>

            <option>
              Last Year
            </option>

          </select>

        </div>


        <button
          className="generate-button"
          type="button"
          onClick={loadReport}
          disabled={loading}
        >

          <BarChart3 size={18} />

          {loading
            ? 'Loading Dataset...'
            : 'Generate Report'}

        </button>

      </div>


      {/* KPI CARDS */}

      <div className="report-kpis">

        <div className="report-kpi-card">

          <div className="kpi-icon revenue">
            <TrendingUp size={22} />
          </div>

          <div>

            <span>
              Total Revenue
            </span>

            <strong>
              {loading
                ? 'Loading...'
                : formatCurrency(
                    kpis.revenue
                  )}
            </strong>

          </div>

        </div>


        <div className="report-kpi-card">

          <div className="kpi-icon profit">
            <TrendingUp size={22} />
          </div>

          <div>

            <span>
              Total Profit
            </span>

            <strong>
              {loading
                ? 'Loading...'
                : formatCurrency(
                    kpis.profit
                  )}
            </strong>

          </div>

        </div>


        <div className="report-kpi-card">

          <div className="kpi-icon orders">
            <ShoppingCart size={22} />
          </div>

          <div>

            <span>
              Total Orders
            </span>

            <strong>
              {loading
                ? 'Loading...'
                : formatNumber(
                    kpis.orders
                  )}
            </strong>

          </div>

        </div>


        <div className="report-kpi-card">

          <div className="kpi-icon customers">
            <Users size={22} />
          </div>

          <div>

            <span>
              Total Customers
            </span>

            <strong>
              {loading
                ? 'Loading...'
                : formatNumber(
                    kpis.customers
                  )}
            </strong>

          </div>

        </div>

      </div>


      {/* DATA TABLES */}

      <div className="report-grid">


        {/* REGIONS */}

        <div className="report-card">

          <div className="report-card-header">

            <div>

              <h2>
                Regional Performance
              </h2>

              <p>
                Revenue distribution
                from your dataset
              </p>

            </div>

            <BarChart3 size={22} />

          </div>


          {regionData.length === 0 ? (

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
                    <th>
                      Region
                    </th>

                    <th>
                      Revenue
                    </th>
                  </tr>

                </thead>


                <tbody>

                  {regionData.map(
                    (row, index) => (

                      <tr
                        key={
                          `region-${index}`
                        }
                      >

                        <td>
                          {String(
                            getRowName(
                              row
                            )
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            getRowValue(
                              row
                            )
                          )}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* CATEGORY */}

        <div className="report-card">

          <div className="report-card-header">

            <div>

              <h2>
                Category Performance
              </h2>

              <p>
                Revenue by product category
              </p>

            </div>

            <PieChart size={22} />

          </div>


          {categoryData.length === 0 ? (

            <div className="empty-report">

              <PieChart size={40} />

              <p>
                No category data available.
              </p>

            </div>

          ) : (

            <div className="report-table-wrapper">

              <table className="report-table">

                <thead>

                  <tr>

                    <th>
                      Category
                    </th>

                    <th>
                      Revenue
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {categoryData.map(
                    (row, index) => (

                      <tr
                        key={
                          `category-${index}`
                        }
                      >

                        <td>
                          {String(
                            getRowName(
                              row
                            )
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            getRowValue(
                              row
                            )
                          )}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* TOP PRODUCTS */}

        <div className="report-card">

          <div className="report-card-header">

            <div>

              <h2>
                Top Products
              </h2>

              <p>
                Best performing products
              </p>

            </div>

            <ShoppingCart size={22} />

          </div>


          {productData.length === 0 ? (

            <div className="empty-report">

              <ShoppingCart size={40} />

              <p>
                No product data available.
              </p>

            </div>

          ) : (

            <div className="report-table-wrapper">

              <table className="report-table">

                <thead>

                  <tr>

                    <th>
                      Product
                    </th>

                    <th>
                      Value
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {productData
                    .slice(0, 10)
                    .map(
                      (row, index) => (

                        <tr
                          key={
                            `product-${index}`
                          }
                        >

                          <td>
                            {String(
                              getRowName(
                                row
                              )
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              getRowValue(
                                row
                              )
                            )}
                          </td>

                        </tr>

                      )
                    )}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* REPORT SUMMARY */}

        <div className="report-card">

          <div className="report-card-header">

            <div>

              <h2>
                Report Summary
              </h2>

              <p>
                {reportType} • {period}
              </p>

            </div>

            <FileText size={22} />

          </div>


          <div className="summary-list">

            <div>

              <span>
                Revenue
              </span>

              <strong>
                {formatCurrency(
                  kpis.revenue
                )}
              </strong>

            </div>


            <div>

              <span>
                Profit
              </span>

              <strong>
                {formatCurrency(
                  kpis.profit
                )}
              </strong>

            </div>


            <div>

              <span>
                Orders
              </span>

              <strong>
                {formatNumber(
                  kpis.orders
                )}
              </strong>

            </div>


            <div>

              <span>
                Customers
              </span>

              <strong>
                {formatNumber(
                  kpis.customers
                )}
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