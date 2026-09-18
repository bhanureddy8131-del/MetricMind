import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  Save,
  RotateCcw,
} from 'lucide-react'

import { apiService } from '../services/api'

function AddData() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    order_id: '',
    order_date: '',
    customer_name: '',
    region: '',
    state: '',
    city: '',
    category: '',
    sub_category: '',
    product_name: '',
    sales: '',
    quantity: 1,
    discount: '',
    profit: '',
    payment_method: '',
    shipping_mode: '',
  })

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function clearForm() {
    setForm({
      order_id: '',
      order_date: '',
      customer_name: '',
      region: '',
      state: '',
      city: '',
      category: '',
      sub_category: '',
      product_name: '',
      sales: '',
      quantity: 1,
      discount: '',
      profit: '',
      payment_method: '',
      shipping_mode: '',
    })

    setSuccess('')
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setLoading(true)
    setSuccess('')
    setError('')

    try {
      const payload = {
        order_id: form.order_id.trim(),
        order_date: form.order_date,
        customer_name: form.customer_name.trim(),
        region: form.region,
        state: form.state || null,
        city: form.city || null,
        category: form.category,
        sub_category: form.sub_category || null,
        product_name: form.product_name.trim(),
        sales: Number(form.sales || 0),
        quantity: Number(form.quantity || 1),
        discount: Number(form.discount || 0),
        profit: Number(form.profit || 0),
        payment_method: form.payment_method || null,
        shipping_mode: form.shipping_mode || null,
      }

      await apiService.addBusinessData(payload)

      const orderId = form.order_id

      clearForm()

      setSuccess(
        'Order ' + orderId + ' added successfully!'
      )

      setTimeout(() => {
        setSuccess('')
      }, 5000)
    } catch (err) {
      console.error('Add data error:', err)

      setError(
        err?.message ||
          'Unable to add data. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-data-page">

      <div className="add-data-header">

        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div>
          <h1>Add Business Data</h1>

          <p>
            Add a new sales or order record to MetricMind.
          </p>
        </div>

      </div>

      {success && (
        <div className="success-message">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form
        className="add-data-card"
        onSubmit={handleSubmit}
      >

        {/* ORDER INFORMATION */}

        <section>
          <h2>Order Information</h2>

          <div className="form-grid">

            <div className="form-group">
              <label>Order ID *</label>

              <input
                type="text"
                name="order_id"
                value={form.order_id}
                onChange={handleChange}
                placeholder="ORD-1001"
                required
              />
            </div>

            <div className="form-group">
              <label>Order Date *</label>

              <input
                type="date"
                name="order_date"
                value={form.order_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Customer Name *</label>

              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                placeholder="Rahul Kumar"
                required
              />
            </div>

          </div>
        </section>

        {/* LOCATION */}

        <section>
          <h2>Location</h2>

          <div className="form-grid">

            <div className="form-group">
              <label>Region *</label>

              <select
                name="region"
                value={form.region}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select region
                </option>

                <option value="South">
                  South
                </option>

                <option value="North">
                  North
                </option>

                <option value="East">
                  East
                </option>

                <option value="West">
                  West
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>State</label>

              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="Karnataka"
              />
            </div>

            <div className="form-group">
              <label>City</label>

              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Bengaluru"
              />
            </div>

          </div>
        </section>

        {/* PRODUCT INFORMATION */}

        <section>
          <h2>Product Information</h2>

          <div className="form-grid">

            <div className="form-group">
              <label>Category *</label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select category
                </option>

                <option value="Technology">
                  Technology
                </option>

                <option value="Furniture">
                  Furniture
                </option>

                <option value="Office Supplies">
                  Office Supplies
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>Sub-Category</label>

              <input
                type="text"
                name="sub_category"
                value={form.sub_category}
                onChange={handleChange}
                placeholder="Computers"
              />
            </div>

            <div className="form-group">
              <label>Product Name *</label>

              <input
                type="text"
                name="product_name"
                value={form.product_name}
                onChange={handleChange}
                placeholder="Dell Laptop"
                required
              />
            </div>

          </div>
        </section>

        {/* SALES INFORMATION */}

        <section>
          <h2>Sales Information</h2>

          <div className="form-grid">

            <div className="form-group">
              <label>Sales *</label>

              <input
                type="number"
                step="0.01"
                min="0"
                name="sales"
                value={form.sales}
                onChange={handleChange}
                placeholder="75000"
                required
              />
            </div>

            <div className="form-group">
              <label>Quantity *</label>

              <input
                type="number"
                min="1"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Profit</label>

              <input
                type="number"
                step="0.01"
                name="profit"
                value={form.profit}
                onChange={handleChange}
                placeholder="10000"
              />
            </div>

            <div className="form-group">
              <label>Discount</label>

              <input
                type="number"
                step="0.01"
                min="0"
                name="discount"
                value={form.discount}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

          </div>
        </section>

        {/* PAYMENT AND SHIPPING */}

        <section>
          <h2>Payment & Shipping</h2>

          <div className="form-grid">

            <div className="form-group">
              <label>Payment Method</label>

              <select
                name="payment_method"
                value={form.payment_method}
                onChange={handleChange}
              >
                <option value="">
                  Select payment
                </option>

                <option value="UPI">
                  UPI
                </option>

                <option value="Cash">
                  Cash
                </option>

                <option value="Credit Card">
                  Credit Card
                </option>

                <option value="Debit Card">
                  Debit Card
                </option>

                <option value="Net Banking">
                  Net Banking
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>Shipping Mode</label>

              <select
                name="shipping_mode"
                value={form.shipping_mode}
                onChange={handleChange}
              >
                <option value="">
                  Select shipping
                </option>

                <option value="Standard Class">
                  Standard Class
                </option>

                <option value="Second Class">
                  Second Class
                </option>

                <option value="First Class">
                  First Class
                </option>

                <option value="Same Day">
                  Same Day
                </option>
              </select>
            </div>

          </div>
        </section>

        {/* ACTIONS */}

        <div className="form-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={clearForm}
            disabled={loading}
          >
            <RotateCcw size={18} />
            Clear
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            <Save size={18} />

            {loading
              ? 'Saving...'
              : 'Add Data'}
          </button>

        </div>

      </form>

    </div>
  )
}

export default AddData