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
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

import * as XLSX from 'xlsx'

import { apiService } from '../services/api'


function Reports() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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


  // ============================================================
  // LOAD REPORT WHEN FILTERS CHANGE
  // ============================================================

  useEffect(() => {
    loadReport()
  }, [period, reportType])


  // ============================================================
  // API QUERY HELPER
  // ============================================================

  async function ask(question) {
    try {
      const response =
        await apiService.query({
          question,
        })

      return response?.data || response || null

    } catch (error) {
      console.error(
        'Report query failed:',
        question,
        error
      )

      return null
    }
  }


  // ============================================================
  // LOAD REPORT DATA
  // ============================================================

  async function loadReport() {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
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
        !customersResult &&
        !regionResult &&
        !categoryResult &&
        !productResult


      if (everythingFailed) {
        setError(
          'Unable to load report data from the backend.'
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


  // ============================================================
  // EXTRACT NUMBER FROM API RESPONSE
  // ============================================================

  function extractNumber(result) {
    if (!result) {
      return 0
    }


    // --------------------------------------------
    // data = array
    // --------------------------------------------

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

        const preferredKeys = [
          'value',
          'total',
          'revenue',
          'sales',
          'profit',
          'orders',
          'customers',
          'count',
          'total_revenue',
          'total_profit',
          'order_count',
          'customer_count',
        ]


        for (
          const key of preferredKeys
        ) {

          if (
            first[key] !== undefined &&
            first[key] !== null
          ) {

            const value =
              Number(first[key])

            if (
              Number.isFinite(value)
            ) {
              return value
            }
          }
        }


        const values =
          Object.values(first)


        for (
          const value of values
        ) {

          const numericValue =
            Number(value)

          if (
            value !== null &&
            value !== '' &&
            Number.isFinite(
              numericValue
            )
          ) {
            return numericValue
          }
        }
      }
    }


    // --------------------------------------------
    // data = number
    // --------------------------------------------

    if (
      typeof result.data === 'number'
    ) {
      return result.data
    }


    // --------------------------------------------
    // data = object
    // --------------------------------------------

    if (
      result.data &&
      typeof result.data === 'object'
    ) {

      const preferredKeys = [
        'value',
        'total',
        'revenue',
        'sales',
        'profit',
        'orders',
        'customers',
        'count',
        'total_revenue',
        'total_profit',
        'order_count',
        'customer_count',
      ]


      for (
        const key of preferredKeys
      ) {

        if (
          result.data[key] !== undefined &&
          result.data[key] !== null
        ) {

          const value =
            Number(
              result.data[key]
            )

          if (
            Number.isFinite(value)
          ) {
            return value
          }
        }
      }


      const values =
        Object.values(result.data)


      for (
        const value of values
      ) {

        const numericValue =
          Number(value)

        if (
          value !== null &&
          value !== '' &&
          Number.isFinite(
            numericValue
          )
        ) {
          return numericValue
        }
      }
    }


    // --------------------------------------------
    // answer text fallback
    // --------------------------------------------

    if (
      typeof result.answer === 'string'
    ) {

      const matches =
        result.answer.match(
          /-?\d[\d,]*(?:\.\d+)?/g
        )


      if (
        matches &&
        matches.length > 0
      ) {

        return Number(
          matches[0].replace(
            /,/g,
            ''
          )
        )
      }
    }


    return 0
  }


  // ============================================================
  // NORMALIZE TABLE DATA
  // ============================================================

  function normalizeRows(result) {
    if (!result) {
      return []
    }


    if (
      Array.isArray(result)
    ) {
      return result
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


    if (
      Array.isArray(result.rows)
    ) {
      return result.rows
    }


    if (
      Array.isArray(result.results)
    ) {
      return result.results
    }


    return []
  }


  // ============================================================
  // GET ROW NAME
  // ============================================================

  function getRowName(row) {
    if (!row) {
      return 'Unknown'
    }


    const possibleKeys = [
      'name',
      'region',
      'category',
      'product_name',
      'product',
      'segment',
      'state',
      'city',

      'Name',
      'Region',
      'Category',
      'Product',
      'Product Name',
      'Segment',
      'State',
      'City',
    ]


    for (
      const key of possibleKeys
    ) {

      if (
        row[key] !== undefined &&
        row[key] !== null &&
        String(row[key]).trim() !== ''
      ) {
        return row[key]
      }
    }


    const values =
      Object.values(row)


    if (
      values.length > 0
    ) {
      return values[0]
    }


    return 'Unknown'
  }


  // ============================================================
  // GET ROW VALUE
  // ============================================================

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
      'total_profit',
      'sum',
      'SUM(sales)',
      'SUM(profit)',
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

      const numericValue =
        Number(value)

      if (
        value !== null &&
        value !== '' &&
        Number.isFinite(
          numericValue
        )
      ) {
        return numericValue
      }
    }


    return 0
  }


  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  function formatCurrency(value) {
    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }
    ).format(
      Number(value) || 0
    )
  }


  // ============================================================
  // FORMAT NUMBER
  // ============================================================

  function formatNumber(value) {
    return new Intl.NumberFormat(
      'en-IN'
    ).format(
      Number(value) || 0
    )
  }


  // ============================================================
  // PREPARE REGIONAL DATA FOR EXCEL
  // ============================================================

  function prepareRegionRows() {
    return regionData.map(
      (row) => ({
        Region:
          String(
            getRowName(row)
          ),

        Revenue:
          Number(
            getRowValue(row)
          ),
      })
    )
  }


  // ============================================================
  // PREPARE CATEGORY DATA FOR EXCEL
  // ============================================================

  function prepareCategoryRows() {
    return categoryData.map(
      (row) => ({
        Category:
          String(
            getRowName(row)
          ),

        Revenue:
          Number(
            getRowValue(row)
          ),
      })
    )
  }


  // ============================================================
  // PREPARE PRODUCT DATA FOR EXCEL
  // ============================================================

  function prepareProductRows() {
    return productData
      .slice(0, 10)
      .map(
        (row, index) => ({
          Rank:
            index + 1,

          Product:
            String(
              getRowName(row)
            ),

          Value:
            Number(
              getRowValue(row)
            ),
        })
      )
  }


  // ============================================================
  // DOWNLOAD EXCEL REPORT
  // ============================================================

  function downloadReport() {
    try {
      setDownloading(true)
      setError('')
      setSuccess('')


      // --------------------------------------------------------
      // CREATE WORKBOOK
      // --------------------------------------------------------

      const workbook =
        XLSX.utils.book_new()


      // --------------------------------------------------------
      // SUMMARY SHEET
      // --------------------------------------------------------

      const summaryRows = [
        ['MetricMind Business Report'],
        [],
        ['Report Type', reportType],
        ['Period', period],
        [
          'Generated At',
          new Date().toLocaleString(
            'en-IN'
          ),
        ],
        [],
        ['Business Summary'],
        [],
        ['Metric', 'Value'],
        [
          'Total Revenue',
          kpis.revenue,
        ],
        [
          'Total Profit',
          kpis.profit,
        ],
        [
          'Total Orders',
          kpis.orders,
        ],
        [
          'Total Customers',
          kpis.customers,
        ],
        [],
        [
          'Regional Records',
          regionData.length,
        ],
        [
          'Category Records',
          categoryData.length,
        ],
        [
          'Top Product Records',
          Math.min(
            productData.length,
            10
          ),
        ],
      ]


      const summarySheet =
        XLSX.utils.aoa_to_sheet(
          summaryRows
        )


      summarySheet['!cols'] = [
        { wch: 28 },
        { wch: 28 },
      ]


      // --------------------------------------------------------
      // REGION SHEET
      // --------------------------------------------------------

      const regionRows =
        prepareRegionRows()


      const regionSheet =
        XLSX.utils.json_to_sheet(
          regionRows.length > 0
            ? regionRows
            : [
                {
                  Region:
                    'No data available',
                  Revenue: 0,
                },
              ]
        )


      regionSheet['!cols'] = [
        { wch: 28 },
        { wch: 20 },
      ]


      // --------------------------------------------------------
      // CATEGORY SHEET
      // --------------------------------------------------------

      const categoryRows =
        prepareCategoryRows()


      const categorySheet =
        XLSX.utils.json_to_sheet(
          categoryRows.length > 0
            ? categoryRows
            : [
                {
                  Category:
                    'No data available',
                  Revenue: 0,
                },
              ]
        )


      categorySheet['!cols'] = [
        { wch: 30 },
        { wch: 20 },
      ]


      // --------------------------------------------------------
      // PRODUCT SHEET
      // --------------------------------------------------------

      const productRows =
        prepareProductRows()


      const productSheet =
        XLSX.utils.json_to_sheet(
          productRows.length > 0
            ? productRows
            : [
                {
                  Rank: '',
                  Product:
                    'No data available',
                  Value: 0,
                },
              ]
        )


      productSheet['!cols'] = [
        { wch: 10 },
        { wch: 55 },
        { wch: 20 },
      ]


      // --------------------------------------------------------
      // ADD FILTERS
      // --------------------------------------------------------

      if (regionRows.length > 0) {
        regionSheet['!autofilter'] = {
          ref:
            `A1:B${regionRows.length + 1}`,
        }
      }


      if (categoryRows.length > 0) {
        categorySheet['!autofilter'] = {
          ref:
            `A1:B${categoryRows.length + 1}`,
        }
      }


      if (productRows.length > 0) {
        productSheet['!autofilter'] = {
          ref:
            `A1:C${productRows.length + 1}`,
        }
      }


      // --------------------------------------------------------
      // FREEZE HEADER ROWS
      // --------------------------------------------------------

      regionSheet['!freeze'] = {
        xSplit: 0,
        ySplit: 1,
      }


      categorySheet['!freeze'] = {
        xSplit: 0,
        ySplit: 1,
      }


      productSheet['!freeze'] = {
        xSplit: 0,
        ySplit: 1,
      }


      // --------------------------------------------------------
      // FORMAT CURRENCY CELLS
      // --------------------------------------------------------

      function applyCurrencyFormat(
        sheet,
        column,
        startRow,
        endRow
      ) {

        for (
          let row = startRow;
          row <= endRow;
          row++
        ) {

          const cell =
            sheet[
              `${column}${row}`
            ]

          if (cell) {
            cell.z =
              '₹#,##0.00'
          }
        }
      }


      if (regionRows.length > 0) {
        applyCurrencyFormat(
          regionSheet,
          'B',
          2,
          regionRows.length + 1
        )
      }


      if (categoryRows.length > 0) {
        applyCurrencyFormat(
          categorySheet,
          'B',
          2,
          categoryRows.length + 1
        )
      }


      if (productRows.length > 0) {
        applyCurrencyFormat(
          productSheet,
          'C',
          2,
          productRows.length + 1
        )
      }


      // --------------------------------------------------------
      // SUMMARY CURRENCY FORMAT
      // --------------------------------------------------------

      if (summarySheet['B10']) {
        summarySheet['B10'].z =
          '₹#,##0.00'
      }

      if (summarySheet['B11']) {
        summarySheet['B11'].z =
          '₹#,##0.00'
      }


      // --------------------------------------------------------
      // ADD SHEETS TO WORKBOOK
      // --------------------------------------------------------

      XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        'Summary'
      )


      XLSX.utils.book_append_sheet(
        workbook,
        regionSheet,
        'Regional Performance'
      )


      XLSX.utils.book_append_sheet(
        workbook,
        categorySheet,
        'Category Performance'
      )


      XLSX.utils.book_append_sheet(
        workbook,
        productSheet,
        'Top Products'
      )


      // --------------------------------------------------------
      // CREATE FILE NAME
      // --------------------------------------------------------

      const safeReportType =
        reportType
          .replace(
            /[^a-z0-9]+/gi,
            '-'
          )
          .replace(
            /^-|-$/g,
            ''
          )
          .toLowerCase()


      const safePeriod =
        period
          .replace(
            /[^a-z0-9]+/gi,
            '-'
          )
          .replace(
            /^-|-$/g,
            ''
          )
          .toLowerCase()


      const fileName =
        `metricmind-${safeReportType}-${safePeriod}.xlsx`


      // --------------------------------------------------------
      // DOWNLOAD
      // --------------------------------------------------------

      XLSX.writeFile(
        workbook,
        fileName
      )


      setSuccess(
        `Report downloaded successfully as ${fileName}`
      )

    } catch (error) {
      console.error(
        'Report download error:',
        error
      )

      setError(
        'Unable to create the Excel report. Please try again.'
      )

    } finally {
      setDownloading(false)
    }
  }


  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="reports-page">

      {/* ======================================================
          HEADER
      ======================================================= */}

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


      {/* ======================================================
          SUCCESS
      ======================================================= */}

      {success && (

        <div className="report-success">

          <CheckCircle size={18} />

          <span>
            {success}
          </span>

        </div>

      )}


      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (

        <div className="report-error">

          <AlertCircle size={18} />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ======================================================
          CONTROLS
      ======================================================= */}

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


      {/* ======================================================
          KPI CARDS
      ======================================================= */}

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


      {/* ======================================================
          REPORT GRID
      ======================================================= */}

      <div className="report-grid">


        {/* ====================================================
            REGIONAL PERFORMANCE
        ===================================================== */}

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


        {/* ====================================================
            CATEGORY PERFORMANCE
        ===================================================== */}

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


        {/* ====================================================
            TOP PRODUCTS
        ===================================================== */}

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
                      Profit
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


        {/* ====================================================
            REPORT SUMMARY
        ===================================================== */}

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


          {/* ==================================================
              EXCEL DOWNLOAD
          =================================================== */}

          <button
            className="download-report-button"
            type="button"
            onClick={downloadReport}
            disabled={
              loading ||
              downloading
            }
          >

            {downloading ? (
              <>
                <RefreshCw
                  size={18}
                  className="spin"
                />

                Creating Excel Report...
              </>
            ) : (
              <>
                <Download size={18} />

                Download Excel Report
              </>
            )}

          </button>

        </div>

      </div>

    </div>
  )
}


export default Reports