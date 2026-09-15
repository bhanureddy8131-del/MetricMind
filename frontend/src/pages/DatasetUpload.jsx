import { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Database, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './DatasetUpload.css'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'

export default function DatasetUpload() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]

    setMessage('')
    setError('')

    if (!selectedFile) {
      return
    }

    const isCSV =
      selectedFile.name.toLowerCase().endsWith('.csv') ||
      selectedFile.type === 'text/csv'

    if (!isCSV) {
      setFile(null)
      setError('Please select a CSV file.')
      return
    }

    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file first.')
      return
    }

    setLoading(true)
    setMessage('')
    setError('')

    try {
      /*
       * The current MetricMind backend already supports loading a dataset
       * through /api/data/load.
       *
       * The backend expects a file path, so this sends the selected
       * filename as the requested dataset path.
       */
      const token = localStorage.getItem('metricmind_token')

      const response = await fetch(`${API_BASE_URL}/data/load`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
        body: JSON.stringify({
          file_path: `Dataset/${file.name}`,
          overwrite: true,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            'Dataset could not be loaded by the backend.'
        )
      }

      setMessage('Dataset loaded successfully.')
    } catch (err) {
      console.error('Dataset upload error:', err)

      setError(
        err.message ||
          'Unable to load dataset. Make sure the backend is running on port 8001.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dataset-page">
      <div className="dataset-header">
        <button
          className="back-button"
          onClick={() => navigate('/')}
          type="button"
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div>
          <div className="dataset-eyebrow">DATA MANAGEMENT</div>
          <h1>Dataset Upload</h1>
          <p>
            Add your Superstore CSV dataset to MetricMind and use it for
            analytics and AI queries.
          </p>
        </div>
      </div>

      <div className="dataset-grid">
        <section className="upload-card">
          <div className="upload-icon">
            <Upload size={28} />
          </div>

          <h2>Upload your dataset</h2>

          <p className="upload-description">
            Select a CSV file containing your business data.
          </p>

          <button
            className="drop-zone"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} />

            <strong>
              {file ? file.name : 'Choose CSV file'}
            </strong>

            <span>
              {file
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                : 'Click here to browse your computer'}
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            hidden
          />

          {file && (
            <div className="selected-file">
              <FileText size={20} />

              <div>
                <strong>{file.name}</strong>
                <span>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              <CheckCircle size={20} />
            </div>
          )}

          {error && (
            <div className="dataset-message error">
              <XCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="dataset-message success">
              <CheckCircle size={20} />
              <span>{message}</span>
            </div>
          )}

          <button
            className="upload-button"
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            <Database size={19} />

            {loading ? 'Loading dataset...' : 'Load Dataset'}
          </button>
        </section>

        <section className="info-card">
          <div className="info-icon">
            <Database size={25} />
          </div>

          <h2>MetricMind Dataset</h2>

          <p>
            MetricMind is designed to work with structured business data.
          </p>

          <div className="requirements">
            <h3>Recommended columns</h3>

            <div className="column-list">
              <span>Order ID</span>
              <span>Order Date</span>
              <span>Customer ID</span>
              <span>Region</span>
              <span>Category</span>
              <span>Product Name</span>
              <span>Sales</span>
              <span>Quantity</span>
              <span>Profit</span>
            </div>
          </div>

          <div className="dataset-note">
            <strong>Tip</strong>
            <p>
              Your cleaned Superstore dataset can be used to generate revenue,
              profit, order, customer, region and category analytics.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}